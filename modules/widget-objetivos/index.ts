export interface ObjetivoHoyItem {
	texto: string;
	completado: boolean;
}

/**
 * Deja una "foto" de los objetivos de hoy en el App Group compartido con el
 * widget de iOS y le pide a WidgetKit que se redibuje. No hace nada en web ni
 * si el módulo nativo todavía no está compilado en el binario actual (por
 * ejemplo, antes del primer rebuild nativo después de agregar este módulo) —
 * falla en silencio para no romper el resto de la app.
 */
export const escribirSnapshotObjetivosHoy = (items: ObjetivoHoyItem[]): void => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const nativo = require("./src/WidgetObjetivosModule").default;
		nativo.escribirSnapshotObjetivosHoy(
			JSON.stringify({ items, actualizadoEn: new Date().toISOString() }),
		);
	} catch {
		// Sin módulo nativo disponible (web, o app nativa no reconstruida todavía): no-op.
	}
};
