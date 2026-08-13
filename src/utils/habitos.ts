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

export const finDeSemana = (fecha: Date): Date => {
	const inicio = inicioDeSemana(fecha);
	const fin = new Date(inicio);
	fin.setDate(fin.getDate() + 6);
	fin.setHours(0, 0, 0, 0);
	return fin;
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

export const generarKeyAPartirDeFecha = (fecha: Date) => {
	return fecha
		.toISOString()
		.replace(/[^0-9]/g, "")
		.slice(0, -3);
};

export const convertirEnKey = (txt: string) =>
	txt
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9 áéíóúÁÉÍÓÚ_]/gi, "")
		.replace(/ /g, "_");

export const fechaEsDeHaceMenosDe5Minutos = (fecha: Date): boolean => {
	const cincoMinutos = 1000 * 60 * 5;
	const horaHace5Minutos = Date.now() - cincoMinutos;
	return fecha > new Date(horaHace5Minutos);
};
