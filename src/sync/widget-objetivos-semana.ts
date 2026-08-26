import { TipoListaObjetivoEnum } from "@/api/clients";
import { claveSemana } from "@/utils/objetivos";
import { escribirSnapshotObjetivosSemana } from "../../modules/widget-objetivos";
import { itemsObjetivoDb } from "./db";

/**
 * Recalcula el snapshot de "objetivos de la semana" desde SQLite y se lo pasa
 * al widget de iOS (vía App Group). Se llama después de cualquier escritura
 * de objetivos y después de cada `pull()` exitoso — mismo mecanismo que
 * `actualizarWidgetObjetivosHoy` (ver ese archivo).
 */
export const actualizarWidgetObjetivosSemana = async (): Promise<void> => {
	const clave = claveSemana(new Date());
	const items = await itemsObjetivoDb.todos();
	const deEstaSemana = items
		.filter((i) => i.listaTipo === TipoListaObjetivoEnum._2 && i.listaClavePeriodo === clave)
		.sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0))
		.map((i) => ({ texto: i.texto, completado: i.completado }));
	escribirSnapshotObjetivosSemana(deEstaSemana);
};
