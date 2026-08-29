import { TipoListaObjetivoEnum } from "@/api/clients";
import { claveMes } from "@/utils/objetivos";
import { escribirSnapshotObjetivosMes } from "../../modules/widget-objetivos";
import { itemsObjetivoDb } from "./db";

/**
 * Recalcula el snapshot de "objetivos del mes" desde SQLite y se lo pasa al
 * widget de iOS (vía App Group). Mismo mecanismo que `actualizarWidgetObjetivosHoy`
 * (ver ese archivo).
 */
export const actualizarWidgetObjetivosMes = async (): Promise<void> => {
	const clave = claveMes(new Date());
	const items = await itemsObjetivoDb.todos();
	const delMes = items
		.filter((i) => i.listaTipo === TipoListaObjetivoEnum._3 && i.listaClavePeriodo === clave)
		.sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0))
		.map((i) => ({ texto: i.texto, completado: i.completado }));
	escribirSnapshotObjetivosMes(delMes);
};
