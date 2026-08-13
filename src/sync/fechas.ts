/** Fecha local en formato YYYY-MM-DD (clave de día/período). */
export const fechaClave = (fecha: Date): string => {
	const year = fecha.getFullYear();
	const month = String(fecha.getMonth() + 1).padStart(2, "0");
	const day = String(fecha.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

/** Interpreta una clave YYYY-MM-DD como medianoche local. */
export const parsearFechaClave = (clave: string): Date => {
	const [year, month, day] = clave.split("-").map(Number);
	return new Date(year, month - 1, day);
};

/**
 * Date para parámetros de API que serializan con toISOString().
 * Fija el día calendario local a mediodía UTC, evitando que zonas como GMT-3
 * adelanten el día a las 21:00 (medianoche UTC).
 */
export const fechaCalendarioLocal = (fecha: Date): Date => {
	const [year, month, day] = fechaClave(fecha).split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
};

/** Extrae YYYY-MM-DD de fechas calendario serializadas por el servidor (UTC). */
export const fechaCalendarioDesdeApi = (fecha: Date): string => {
	const year = fecha.getUTCFullYear();
	const month = String(fecha.getUTCMonth() + 1).padStart(2, "0");
	const day = String(fecha.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};
