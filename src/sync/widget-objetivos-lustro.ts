import { TipoListaObjetivoEnum } from "@/api/clients";
import { claveLustro } from "@/utils/objetivos";
import { escribirSnapshotObjetivosLustro } from "../../modules/widget-objetivos";
import { itemsObjetivoDb } from "./db";

/**
 * Recalcula el snapshot de "objetivos del lustro" desde SQLite y se lo pasa al
 * widget de iOS (vía App Group). Mismo mecanismo que `actualizarWidgetObjetivosHoy`
 * (ver ese archivo).
 */
export const actualizarWidgetObjetivosLustro = async (): Promise<void> => {
	const clave = claveLustro(new Date());
	const items = await itemsObjetivoDb.todos();
	const delLustro = items
		.filter((i) => i.listaTipo === TipoListaObjetivoEnum._5 && i.listaClavePeriodo === clave)
		.sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0))
		.map((i) => ({ texto: i.texto, completado: i.completado }));
	escribirSnapshotObjetivosLustro(delLustro);
};
