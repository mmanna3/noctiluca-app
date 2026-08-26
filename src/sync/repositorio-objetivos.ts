import { encolarOperacion, itemsObjetivoDb } from "./db";
import { nuevoId } from "./ids";
import { compactar } from "./outbox";
import { sincronizarPronto } from "./sync-engine";
import { ItemObjetivoLocal, OperacionOutbox } from "./tipos";
import { actualizarWidgetObjetivosHoy } from "./widget-objetivos-hoy";
import { actualizarWidgetObjetivosSemana } from "./widget-objetivos-semana";

const payloadDeItem = (item: ItemObjetivoLocal) => ({
	texto: item.texto,
	completado: item.completado,
	posicion: item.posicion,
	fechaCompletado: item.fechaCompletado,
	listaTipo: item.listaTipo,
	listaClavePeriodo: item.listaClavePeriodo,
});

const encolarUpsertItem = async (item: ItemObjetivoLocal): Promise<void> => {
	const op: OperacionOutbox = {
		clientOpId: nuevoId(),
		entityType: "itemObjetivo",
		operation: "upsert",
		clientEntityId: item.clientId,
		baseVersion: item.version,
		clientTimestamp: new Date().toISOString(),
		payload: payloadDeItem(item),
		intentos: 0,
	};
	await encolarOperacion(item.clientId, compactar, op);
};

/** Alta offline de un ítem de objetivo. Devuelve el clientId. */
export const crearItemObjetivoLocal = async (params: {
	listaTipo: number;
	listaClavePeriodo: string;
	texto: string;
	posicion?: number;
}): Promise<string> => {
	const clientId = nuevoId();
	const todos = await itemsObjetivoDb.todos();
	const items = todos.filter(
		(i) => i.listaTipo === params.listaTipo && i.listaClavePeriodo === params.listaClavePeriodo,
	);
	const posicion = params.posicion ?? items.reduce((max, i) => Math.max(max, i.posicion ?? 0), -1) + 1;

	const item: ItemObjetivoLocal = {
		clientId,
		texto: params.texto,
		completado: false,
		posicion,
		listaTipo: params.listaTipo,
		listaClavePeriodo: params.listaClavePeriodo,
		version: 0,
		pendiente: true,
	};

	await itemsObjetivoDb.put(item);
	await encolarUpsertItem(item);

	void sincronizarPronto();
	void actualizarWidgetObjetivosHoy();
	void actualizarWidgetObjetivosSemana();
	return clientId;
};

export const editarItemObjetivoLocal = async (clientId: string, texto: string): Promise<void> => {
	const actual = await itemsObjetivoDb.porClientId(clientId);
	if (!actual) return;
	const actualizado = { ...actual, texto, pendiente: true };
	await itemsObjetivoDb.put(actualizado);
	await encolarUpsertItem(actualizado);

	void sincronizarPronto();
	void actualizarWidgetObjetivosHoy();
	void actualizarWidgetObjetivosSemana();
};

export const toggleItemObjetivoLocal = async (clientId: string): Promise<void> => {
	const actual = await itemsObjetivoDb.porClientId(clientId);
	if (!actual) return;
	const completado = !actual.completado;
	const actualizado: ItemObjetivoLocal = {
		...actual,
		completado,
		fechaCompletado: completado ? new Date().toISOString() : undefined,
		pendiente: true,
	};
	await itemsObjetivoDb.put(actualizado);
	await encolarUpsertItem(actualizado);

	void sincronizarPronto();
	void actualizarWidgetObjetivosHoy();
	void actualizarWidgetObjetivosSemana();
};

export const eliminarItemObjetivoLocal = async (clientId: string): Promise<void> => {
	const actual = await itemsObjetivoDb.porClientId(clientId);
	await itemsObjetivoDb.delete(clientId);
	await encolarOperacion(clientId, compactar, {
		clientOpId: nuevoId(),
		entityType: "itemObjetivo",
		operation: "delete",
		clientEntityId: clientId,
		baseVersion: actual?.version,
		clientTimestamp: new Date().toISOString(),
		payload: {},
		intentos: 0,
	});

	void sincronizarPronto();
	void actualizarWidgetObjetivosHoy();
	void actualizarWidgetObjetivosSemana();
};

/** Reordena ítems (llamado con el array ya reordenado por los botones ↑/↓). */
export const reordenarItemsObjetivoLocal = async (
	items: { clientId: string; posicion: number }[],
): Promise<void> => {
	for (const { clientId, posicion } of items) {
		const actual = await itemsObjetivoDb.porClientId(clientId);
		if (!actual) continue;
		const actualizado = { ...actual, posicion, pendiente: true };
		await itemsObjetivoDb.put(actualizado);
		await encolarUpsertItem(actualizado);
	}

	void sincronizarPronto();
	void actualizarWidgetObjetivosHoy();
	void actualizarWidgetObjetivosSemana();
};
