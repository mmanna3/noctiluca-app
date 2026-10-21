import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { habitosDb, registrosHabitoDb, suscribirseACambios } from "@/sync/db";
import {
	ID_RESUMEN_SEMANAL,
	PREFIJO_PENDIENTES,
	recordatoriosPendientes,
	RUTA_RESUMEN_SEMANAL,
} from "./notificaciones-core";

/**
 * Notificaciones locales de hábitos (sin push ni backend: iOS las dispara
 * aunque la app esté cerrada y sin conexión).
 *
 * - 23:59: iOS no corre código a esa hora para decidir si avisar, así que se
 *   agenda de antemano un recordatorio por día con hábitos sin marcar y se
 *   recalcula en cada cambio de la base local (marcar, sync) y al volver a la
 *   app. Si el día queda todo marcado, su recordatorio se cancela.
 * - Domingos 18:00: recordatorio semanal fijo que abre el resumen.
 */

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});

const pedirPermiso = async (): Promise<boolean> => {
	const actual = await Notifications.getPermissionsAsync();
	if (actual.granted) return true;
	if (!actual.canAskAgain) return false;
	return (await Notifications.requestPermissionsAsync()).granted;
};

const agendarResumenSemanal = async (): Promise<void> => {
	await Notifications.scheduleNotificationAsync({
		identifier: ID_RESUMEN_SEMANAL,
		content: {
			title: "Resumen semanal",
			body: "Terminó la semana: mirá cómo te fue con tus hábitos.",
			data: { url: RUTA_RESUMEN_SEMANAL },
		},
		// weekday: 1 = domingo (calendario gregoriano de iOS).
		trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 18, minute: 0 },
	});
};

let reprogramando = Promise.resolve();

/** Cancela los recordatorios de las 23:59 agendados y vuelve a agendar los que correspondan. */
const reprogramarPendientes = (): Promise<void> => {
	reprogramando = reprogramando.then(async () => {
		const [habitos, registros, agendadas] = await Promise.all([
			habitosDb.todos(),
			registrosHabitoDb.todos(),
			Notifications.getAllScheduledNotificationsAsync(),
		]);
		const deseados = recordatoriosPendientes(habitos, registros);
		const idsDeseados = new Set(deseados.map((r) => r.id));
		for (const n of agendadas) {
			if (n.identifier.startsWith(PREFIJO_PENDIENTES) && !idsDeseados.has(n.identifier))
				await Notifications.cancelScheduledNotificationAsync(n.identifier);
		}
		// Reagendar con el mismo identifier reemplaza la anterior (actualiza el texto).
		for (const r of deseados) {
			await Notifications.scheduleNotificationAsync({
				identifier: r.id,
				content: { title: r.titulo, body: r.cuerpo, data: { url: "/" } },
				trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.fecha },
			});
		}
	}).catch((e) => console.warn("No se pudieron reprogramar los recordatorios de hábitos", e));
	return reprogramando;
};

/**
 * Pide permiso, agenda las notificaciones y las mantiene al día. `alTocar`
 * recibe la ruta a abrir cuando se toca una notificación. Devuelve la limpieza.
 */
export const iniciarNotificacionesHabitos = (alTocar: (ruta: string) => void): (() => void) => {
	let activo = true;
	let temporizador: ReturnType<typeof setTimeout> | undefined;
	const pedirReprogramacion = () => {
		clearTimeout(temporizador);
		temporizador = setTimeout(() => void reprogramarPendientes(), 1000);
	};

	// El arranque en frío puede entregar el mismo toque por las dos vías.
	let ultimoToque = "";
	const abrirRuta = (respuesta: Notifications.NotificationResponse | null) => {
		if (!respuesta) return;
		const clave = `${respuesta.notification.request.identifier}|${respuesta.notification.date}`;
		if (clave === ultimoToque) return;
		ultimoToque = clave;
		Notifications.clearLastNotificationResponse();
		const url = respuesta.notification.request.content.data?.url;
		if (typeof url === "string" && url !== "/") alTocar(url);
	};

	let cancelarCambios = () => {};
	void pedirPermiso().then(async (permitido) => {
		if (!activo || !permitido) return;
		await agendarResumenSemanal();
		await reprogramarPendientes();
		cancelarCambios = suscribirseACambios(pedirReprogramacion);
	});

	// Si la app se abrió tocando una notificación (arranque en frío).
	void Notifications.getLastNotificationResponseAsync().then((r) => {
		if (activo) abrirRuta(r);
	});
	const subRespuesta = Notifications.addNotificationResponseReceivedListener(abrirRuta);
	// Al volver a primer plano puede haber cambiado el día: completar la ventana.
	const subAppState = AppState.addEventListener("change", (estado) => {
		if (estado === "active") pedirReprogramacion();
	});

	return () => {
		activo = false;
		clearTimeout(temporizador);
		cancelarCambios();
		subRespuesta.remove();
		subAppState.remove();
	};
};
