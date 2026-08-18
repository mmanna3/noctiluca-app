import { TipoListaObjetivoEnum } from "@/api/clients";
import { claveDia } from "@/utils/objetivos";
import { escribirSnapshotObjetivosHoy } from "../../modules/widget-objetivos";
import { itemsObjetivoDb } from "./db";

/**
 * Recalcula el snapshot de "objetivos de hoy" desde SQLite y se lo pasa al
 * widget de iOS (vía App Group). Se llama después de cualquier escritura de
 * objetivos y después de cada `pull()` exitoso — el widget no tiene red ni
 * acceso a SQLite propio, así que esta es la única forma en que se entera de
 * cambios.
 */
export const actualizarWidgetObjetivosHoy = async (): Promise<void> => {
	const clave = claveDia(new Date());
	const items = await itemsObjetivoDb.todos();
	const deHoy = items
		.filter((i) => i.listaTipo === TipoListaObjetivoEnum._1 && i.listaClavePeriodo === clave)
		.sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0))
		.map((i) => ({ texto: i.texto, completado: i.completado }));
	escribirSnapshotObjetivosHoy(deHoy);
};
