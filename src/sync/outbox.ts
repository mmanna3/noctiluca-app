import { OperacionOutbox } from "./tipos";

/**
 * Compacta el outbox al agregar una operación nueva, evitando acumular envíos
 * redundantes (típico del autoguardado, que dispara un upsert por cada pausa de
 * tecleo). Reglas:
 *
 * - upsert + upsert de la misma entidad -> se colapsan en uno solo con el
 *   contenido más nuevo, conservando la `baseVersion` original.
 * - cualquier op + delete -> el delete manda (se descarta el upsert pendiente).
 * - delete + upsert -> queda el upsert (la entidad "revive").
 *
 * Es una función pura para poder testearla sin SQLite.
 */
export const compactar = (
	pendientes: OperacionOutbox[],
	nueva: OperacionOutbox,
): OperacionOutbox[] => {
	const indice = pendientes.findIndex(
		(o) => o.clientEntityId === nueva.clientEntityId && o.entityType === nueva.entityType,
	);

	if (indice === -1) return [...pendientes, nueva];

	const existente = pendientes[indice];
	const resultado = [...pendientes];

	if (nueva.operation === "upsert" && existente.operation === "upsert") {
		resultado[indice] = { ...nueva, baseVersion: existente.baseVersion };
		return resultado;
	}

	if (nueva.operation === "delete") {
		resultado[indice] = { ...nueva, baseVersion: existente.baseVersion };
		return resultado;
	}

	resultado[indice] = nueva;
	return resultado;
};
