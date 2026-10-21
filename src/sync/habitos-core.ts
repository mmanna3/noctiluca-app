import { fechaClave } from "./fechas";
import { HabitoLocal, RegistroHabitoLocal } from "./tipos";

/**
 * Tres estados por día y hábito (mismo criterio que `HabitoCore.EvaluarEstado`
 * en el backend):
 * - sí/no: `valorBooleano` true → cumplido, false → no cumplido.
 * - numérico: `valorNumerico` ≥ meta → cumplido; menor (incluido 0, "no lo
 *   hice") → no cumplido.
 * - sin registro, o registro con el valor en null → sin marcar.
 */
export type EstadoDiaHabito = "cumplido" | "no_cumplido" | "sin_marcar";

const TIPO_NUMERICO = 2;

export const estadoDeRegistro = (
	habito: { tipo?: number; metaMinutos?: number },
	registro?: { valorBooleano?: boolean; valorNumerico?: number },
): EstadoDiaHabito => {
	if (!registro) return "sin_marcar";
	if (habito.tipo === TIPO_NUMERICO) {
		if (registro.valorNumerico == null) return "sin_marcar";
		return registro.valorNumerico >= (habito.metaMinutos ?? 1) ? "cumplido" : "no_cumplido";
	}
	if (registro.valorBooleano == null) return "sin_marcar";
	return registro.valorBooleano ? "cumplido" : "no_cumplido";
};

const habitosActivos = (habitos: HabitoLocal[]): HabitoLocal[] =>
	habitos
		.filter((h) => h.activo !== false)
		.sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0));

const indicePorHabitoYFecha = (registros: RegistroHabitoLocal[]): Map<string, RegistroHabitoLocal> =>
	new Map(registros.map((r) => [`${r.habitoClientId}|${r.fecha}`, r]));

/** Cuántos hábitos activos quedan sin marcar (ni sí ni no) en un día. */
export const cantidadSinMarcar = (
	habitos: HabitoLocal[],
	registros: RegistroHabitoLocal[],
	fecha: Date,
): number => {
	const clave = fechaClave(fecha);
	const indice = indicePorHabitoYFecha(registros);
	return habitosActivos(habitos).filter(
		(h) => estadoDeRegistro(h, indice.get(`${h.clientId}|${clave}`)) === "sin_marcar",
	).length;
};

export interface DiaResumenLocal {
	fecha: Date;
	estado: EstadoDiaHabito;
	/** Día posterior a hoy: todavía no se puede marcar, se muestra vacío. */
	futuro: boolean;
	valorNumerico?: number;
}

export interface HabitoResumenLocal {
	clientId: string;
	nombre: string;
	tipo: number;
	metaMinutos?: number;
	diasCumplidos: number;
	diasNoCumplidos: number;
	/** Solo cuenta días hasta hoy (los futuros no están "sin marcar" todavía). */
	diasSinMarcar: number;
	totalMinutos?: number;
	promedioMinutos?: number;
	detallePorDia: DiaResumenLocal[];
}

const inicioDeDia = (fecha: Date): Date => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

/**
 * Resumen de la semana (lunes a domingo) de `fechaSemana`, calculado desde la
 * base local: funciona offline e incluye marcas todavía no sincronizadas.
 */
export const resumenSemanalDesde = (
	habitos: HabitoLocal[],
	registros: RegistroHabitoLocal[],
	fechaSemana: Date,
	hoy = new Date(),
): HabitoResumenLocal[] => {
	const lunes = inicioDeDia(fechaSemana);
	lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
	const limite = inicioDeDia(hoy).getTime();
	const indice = indicePorHabitoYFecha(registros);

	return habitosActivos(habitos).map((h) => {
		const numerico = h.tipo === TIPO_NUMERICO;
		let diasCumplidos = 0;
		let diasNoCumplidos = 0;
		let diasSinMarcar = 0;
		let totalMinutos = 0;
		let diasConValor = 0;

		const detallePorDia = Array.from({ length: 7 }, (_, i): DiaResumenLocal => {
			const fecha = new Date(lunes);
			fecha.setDate(lunes.getDate() + i);
			const registro = indice.get(`${h.clientId}|${fechaClave(fecha)}`);
			const estado = estadoDeRegistro(h, registro);
			const futuro = fecha.getTime() > limite;

			if (estado === "cumplido") diasCumplidos++;
			else if (estado === "no_cumplido") diasNoCumplidos++;
			else if (!futuro) diasSinMarcar++;

			if (numerico && registro?.valorNumerico != null) {
				totalMinutos += registro.valorNumerico;
				diasConValor++;
			}
			return { fecha, estado, futuro, valorNumerico: registro?.valorNumerico };
		});

		return {
			clientId: h.clientId,
			nombre: h.nombre,
			tipo: h.tipo,
			metaMinutos: h.metaMinutos,
			diasCumplidos,
			diasNoCumplidos,
			diasSinMarcar,
			totalMinutos: numerico ? totalMinutos : undefined,
			promedioMinutos:
				numerico && diasConValor > 0 ? Math.round((totalMinutos / diasConValor) * 10) / 10 : undefined,
			detallePorDia,
		};
	});
};
