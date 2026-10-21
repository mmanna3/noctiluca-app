import { fechaClave } from "@/sync/fechas";
import { cantidadSinMarcar } from "@/sync/habitos-core";
import { HabitoLocal, RegistroHabitoLocal } from "@/sync/tipos";

/** Prefijo de los recordatorios de las 23:59 (uno por día: `pendientes-YYYY-MM-DD`). */
export const PREFIJO_PENDIENTES = "pendientes-";
export const ID_RESUMEN_SEMANAL = "resumen-semanal";
export const RUTA_RESUMEN_SEMANAL = "/resumen-habitos";

/**
 * Días hacia adelante (incluido hoy) con recordatorio agendado. iOS admite 64
 * notificaciones locales pendientes; 8 alcanza para que sigan llegando aunque
 * no se abra la app en una semana, y cada apertura vuelve a completar la ventana.
 */
export const DIAS_AGENDADOS = 8;

export interface RecordatorioPendientes {
	id: string;
	fecha: Date;
	titulo: string;
	cuerpo: string;
}

const textoFaltan = (cantidad: number): string =>
	cantidad === 1
		? "Te falta marcar 1 hábito de hoy: ¿lo hiciste o no?"
		: `Te faltan marcar ${cantidad} hábitos de hoy: ¿los hiciste o no?`;

/**
 * Recordatorios de las 23:59 que tienen que quedar agendados: uno por cada día
 * (de hoy en adelante) con hábitos activos sin marcar. Un día con todo marcado
 * (sí o no) no tiene recordatorio, y uno cuya hora ya pasó tampoco.
 */
export const recordatoriosPendientes = (
	habitos: HabitoLocal[],
	registros: RegistroHabitoLocal[],
	ahora = new Date(),
	dias = DIAS_AGENDADOS,
): RecordatorioPendientes[] => {
	const resultado: RecordatorioPendientes[] = [];
	for (let i = 0; i < dias; i++) {
		const fecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + i, 23, 59, 0, 0);
		if (fecha.getTime() <= ahora.getTime()) continue;
		const faltan = cantidadSinMarcar(habitos, registros, fecha);
		if (faltan === 0) continue;
		resultado.push({
			id: `${PREFIJO_PENDIENTES}${fechaClave(fecha)}`,
			fecha,
			titulo: "Hábitos sin marcar",
			cuerpo: textoFaltan(faltan),
		});
	}
	return resultado;
};
