import { api } from "@/api/api";
import { SyncOpDTO, SyncPushDTO } from "@/api/clients";
import { useAuth } from "@/hooks/use-auth";
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import {
	carpetasDb,
	escritosDb,
	guardarCursor,
	habitosDb,
	itemsObjetivoDb,
	leerCursor,
	listasObjetivoDb,
	notificarCambio,
	obtenerDeviceId,
	outboxDb,
	registrosHabitoDb,
} from "./db";
import { recalcularEstado, refrescarPendientes, useEstadoSync } from "./estado-sync";
import { fechaCalendarioDesdeApi } from "./fechas";
import { OperacionOutbox } from "./tipos";
import { actualizarWidgetsObjetivos } from "./widgets-objetivos";

let enEjecucion = false;
let pendienteDeCorrer = false;

/** Encola una sincronización, coalesciendo llamadas mientras una está en curso. */
export const sincronizarPronto = (): void => {
	void sincronizar();
};

export const sincronizar = async (): Promise<void> => {
	if (enEjecucion) {
		pendienteDeCorrer = true;
		return;
	}
	if (!useAuth.getState().token) return;
	if (!useEstadoSync.getState().online) {
		await refrescarPendientes();
		return;
	}

	enEjecucion = true;
	useEstadoSync.getState().setSincronizando(true);
	let syncOk = false;
	try {
		await push();
		await pull();
		actualizarWidgetsObjetivos();
		syncOk = true;
		useEstadoSync.getState().setError(undefined);
	} catch (error) {
		// No perder el outbox ante errores (red, 401, etc.): quedan pendientes.
		useEstadoSync.getState().setError((error as Error)?.message ?? "Error de sincronización");
	} finally {
		enEjecucion = false;
		useEstadoSync.getState().setSincronizando(false);
		if (syncOk) {
			const store = useEstadoSync.getState();
			store.setSyncInicialCompleto(true);
			store.setEstado(recalcularEstado(store.pendientes, store.online));
		}
		await refrescarPendientes();
		if (pendienteDeCorrer) {
			pendienteDeCorrer = false;
			void sincronizar();
		}
	}
};

const fechaCalendario = (d?: Date): string | undefined => (d ? fechaCalendarioDesdeApi(d) : undefined);

const pull = async (): Promise<void> => {
	const cursor = await leerCursor();
	const res = await api.cambios(cursor);

	for (const c of res.carpetas ?? []) {
		if (!c.clientId) continue;
		const local = await carpetasDb.porClientId(c.clientId);
		if (local?.pendiente) continue;
		if (local?.serverId && local.version > (c.version ?? 0)) continue;
		await carpetasDb.put({
			clientId: c.clientId,
			serverId: c.id,
			titulo: c.titulo ?? "",
			version: c.version ?? 0,
			posicion: c.posicion,
			criterioDeOrden: c.criterioDeOrden,
			carpetaPadreId: c.carpetaPadreId ?? undefined,
			esSistema: c.esSistema,
			requiereAutenticacion: c.requiereAutenticacion,
			propositoCarpeta: c.propositoCarpeta ?? undefined,
		});
	}

	for (const e of res.escritos ?? []) {
		if (!e.clientId) continue;
		const local = await escritosDb.porClientId(e.clientId);
		if (local?.pendiente) continue;
		await escritosDb.put({
			clientId: e.clientId,
			serverId: e.id,
			titulo: e.titulo ?? "",
			cuerpo: e.cuerpo ?? "",
			carpetaClientId: e.carpetaClientId,
			carpetaId: e.carpetaId,
			version: e.version ?? 0,
			fechaHoraCreacion: e.fechaHoraCreacion?.toISOString?.() ?? undefined,
			fechaHoraEdicion: e.fechaHoraEdicion?.toISOString?.() ?? undefined,
			estaEnPapelera: e.estaEnPapelera ?? false,
			pendiente: false,
		});
	}

	for (const h of res.habitos ?? []) {
		if (!h.clientId) continue;
		const local = await habitosDb.porClientId(h.clientId);
		if (local?.pendiente) continue;
		await habitosDb.put({
			clientId: h.clientId,
			serverId: h.id,
			nombre: h.nombre ?? "",
			tipo: h.tipo ?? 1,
			activo: h.activo ?? true,
			posicion: h.posicion ?? 0,
			metaMinutos: h.metaMinutos,
			version: h.version ?? 0,
			pendiente: false,
		});
	}

	for (const r of res.registrosHabito ?? []) {
		if (!r.clientId || !r.habitoClientId) continue;
		const registros = await registrosHabitoDb.todos();
		const local = registros.find((x) => x.clientId === r.clientId);
		if (local?.pendiente) continue;
		await registrosHabitoDb.put({
			clientId: r.clientId,
			serverId: r.id,
			habitoClientId: r.habitoClientId,
			habitoId: r.habitoId,
			fecha: fechaCalendario(r.fecha) ?? local?.fecha ?? "",
			valorBooleano: r.valorBooleano,
			valorNumerico: r.valorNumerico,
			version: r.version ?? 0,
			pendiente: false,
		});
	}

	for (const l of res.listasObjetivo ?? []) {
		if (!l.clientId || l.tipo == null || !l.clavePeriodo) continue;
		await listasObjetivoDb.put({
			clientId: l.clientId,
			serverId: l.id,
			tipo: l.tipo,
			clavePeriodo: l.clavePeriodo,
			fechaInicio: l.fechaInicio?.toISOString?.(),
			fechaFin: l.fechaFin?.toISOString?.(),
			fechaCreacion: l.fechaCreacion?.toISOString?.(),
			version: l.version ?? 0,
		});
	}

	for (const i of res.itemsObjetivo ?? []) {
		if (!i.clientId || i.listaTipo == null || !i.listaClavePeriodo) continue;
		const local = await itemsObjetivoDb.porClientId(i.clientId);
		if (local?.pendiente) continue;
		await itemsObjetivoDb.put({
			clientId: i.clientId,
			serverId: i.id,
			listaTipo: i.listaTipo,
			listaClavePeriodo: i.listaClavePeriodo,
			texto: i.texto ?? "",
			completado: i.completado ?? false,
			posicion: i.posicion ?? 0,
			fechaCompletado: i.fechaCompletado?.toISOString?.(),
			version: i.version ?? 0,
			pendiente: false,
		});
	}

	for (const t of res.eliminados ?? []) {
		if (!t.clientId) continue;
		if (t.tipoEntidad === "Escrito") await escritosDb.delete(t.clientId);
		if (t.tipoEntidad === "Carpeta") await carpetasDb.delete(t.clientId);
		if (t.tipoEntidad === "Habito") {
			await habitosDb.delete(t.clientId);
			await registrosHabitoDb.deletePorHabito(t.clientId);
		}
		if (t.tipoEntidad === "ItemObjetivo") await itemsObjetivoDb.delete(t.clientId);
	}

	if (res.cursor != null) await guardarCursor(res.cursor);
	notificarCambio();
};

const push = async (): Promise<void> => {
	const todas = await outboxDb.todas();
	const ops = todas.filter((o) => !o.muerta);
	if (ops.length === 0) return;

	const deviceId = await obtenerDeviceId();
	const dto = new SyncPushDTO({
		deviceId,
		operaciones: ops.map(
			(o) =>
				new SyncOpDTO({
					clientOpId: o.clientOpId,
					entityType: o.entityType,
					operation: o.operation,
					clientEntityId: o.clientEntityId,
					baseVersion: o.baseVersion,
					clientTimestamp: new Date(o.clientTimestamp),
					payload: o.payload,
				}),
		),
	});

	const res = await api.aplicar(dto);

	for (const r of res.resultados ?? []) {
		const op = ops.find((o) => o.clientOpId === r.clientOpId);
		if (!op) continue;

		if (r.estado === "aplicado" || r.estado === "duplicado") {
			await confirmarLocal(op, r.serverId, r.version);
			await outboxDb.delete(op.clientOpId);
		} else if (r.estado === "rechazado") {
			await marcarNoPendiente(op);
			await outboxDb.delete(op.clientOpId);
		} else {
			const intentos = op.intentos + 1;
			await outboxDb.put({ ...op, intentos, muerta: intentos >= 5 });
		}
	}

	notificarCambio();
};

const confirmarLocal = async (op: OperacionOutbox, serverId?: number, version?: number): Promise<void> => {
	switch (op.entityType) {
	case "carpeta": {
		const local = await carpetasDb.porClientId(op.clientEntityId);
		if (!local) return;
		await carpetasDb.put({ ...local, serverId: serverId ?? local.serverId, version: version ?? local.version, pendiente: false });
		break;
	}
	case "habito": {
		const local = await habitosDb.porClientId(op.clientEntityId);
		if (!local) return;
		await habitosDb.put({ ...local, serverId: serverId ?? local.serverId, version: version ?? local.version, pendiente: false });
		break;
	}
	case "registroHabito": {
		const registros = await registrosHabitoDb.todos();
		const local = registros.find((x) => x.clientId === op.clientEntityId);
		if (!local) return;
		await registrosHabitoDb.put({ ...local, serverId: serverId ?? local.serverId, version: version ?? local.version, pendiente: false });
		break;
	}
	case "itemObjetivo": {
		const local = await itemsObjetivoDb.porClientId(op.clientEntityId);
		if (!local) return;
		await itemsObjetivoDb.put({ ...local, serverId: serverId ?? local.serverId, version: version ?? local.version, pendiente: false });
		break;
	}
	default: {
		const local = await escritosDb.porClientId(op.clientEntityId);
		if (!local) return;
		await escritosDb.put({ ...local, serverId: serverId ?? local.serverId, version: version ?? local.version, pendiente: false });
	}
	}
};

const marcarNoPendiente = async (op: OperacionOutbox): Promise<void> => {
	switch (op.entityType) {
	case "carpeta": {
		const local = await carpetasDb.porClientId(op.clientEntityId);
		if (local) await carpetasDb.put({ ...local, pendiente: false });
		break;
	}
	case "habito": {
		const local = await habitosDb.porClientId(op.clientEntityId);
		if (local) await habitosDb.put({ ...local, pendiente: false });
		break;
	}
	case "registroHabito": {
		const registros = await registrosHabitoDb.todos();
		const local = registros.find((x) => x.clientId === op.clientEntityId);
		if (local) await registrosHabitoDb.put({ ...local, pendiente: false });
		break;
	}
	case "itemObjetivo": {
		const local = await itemsObjetivoDb.porClientId(op.clientEntityId);
		if (local) await itemsObjetivoDb.put({ ...local, pendiente: false });
		break;
	}
	default: {
		const local = await escritosDb.porClientId(op.clientEntityId);
		if (local) await escritosDb.put({ ...local, pendiente: false });
	}
	}
};

let syncIniciado = false;

/**
 * Arranca el motor: escucha conectividad (NetInfo) y foreground (AppState),
 * y dispara una sincronización inicial.
 */
export const iniciarSync = (): void => {
	if (syncIniciado) return;
	syncIniciado = true;

	NetInfo.addEventListener((state) => {
		const online = state.isConnected ?? false;
		const eraOffline = !useEstadoSync.getState().online;
		useEstadoSync.getState().setOnline(online);
		if (online && eraOffline) void sincronizar();
		else if (!online) void refrescarPendientes();
	});

	AppState.addEventListener("change", (nextState) => {
		if (nextState === "active") void sincronizar();
	});

	void refrescarPendientes();
	void sincronizar();
};
