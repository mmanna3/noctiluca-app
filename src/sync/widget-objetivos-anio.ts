import { TipoListaObjetivoEnum } from "@/api/clients";
import { claveAnio } from "@/utils/objetivos";
import { escribirSnapshotObjetivosAnio } from "../../modules/widget-objetivos";
import { itemsObjetivoDb } from "./db";

/**
 * Recalcula el snapshot de "objetivos del año" desde SQLite y se lo pasa al
 * widget de iOS (vía App Group). Mismo mecanismo que `actualizarWidgetObjetivosHoy`
 * (ver ese archivo).
 */
export const actualizarWidgetObjetivosAnio = async (): Promise<void> => {
	const clave = claveAnio(new Date());
	const items = await itemsObjetivoDb.todos();
	const delAnio = items
		.filter((i) => i.listaTipo === TipoListaObjetivoEnum._4 && i.listaClavePeriodo === clave)
		.sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0))
		.map((i) => ({ texto: i.texto, completado: i.completado }));
	escribirSnapshotObjetivosAnio(delAnio);
};
