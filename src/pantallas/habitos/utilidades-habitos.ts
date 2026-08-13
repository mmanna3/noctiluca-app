import { fechaClave, parsearFechaClave } from "@/sync/fechas";

export const MAX_HABITOS_ACTIVOS = 5;

export const formatearFechaClave = fechaClave;
export const parsearFechaLocal = parsearFechaClave;

export const inicioDeSemana = (fecha: Date): Date => {
	const copia = new Date(fecha);
	const diasDesdeLunes = (copia.getDay() + 6) % 7;
	copia.setDate(copia.getDate() - diasDesdeLunes);
	copia.setHours(0, 0, 0, 0);
	return copia;
};

export const diasDeSemana = (fechaReferencia: Date): Date[] => {
	const inicio = inicioDeSemana(fechaReferencia);
	return Array.from({ length: 7 }, (_, i) => {
		const dia = new Date(inicio);
		dia.setDate(dia.getDate() + i);
		return dia;
	});
};

export const esDomingo = (fecha: Date = new Date()): boolean => fecha.getDay() === 0;

export const nombreDiaCorto = (fecha: Date): string => {
	const nombres = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
	return nombres[fecha.getDay()];
};

export const esMismaFecha = (a: Date, b: Date): boolean =>
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate();

export const esHabitoSiNo = (tipo?: number): boolean => tipo === 1;

export const esHabitoNumerico = (tipo?: number): boolean => tipo === 2;
