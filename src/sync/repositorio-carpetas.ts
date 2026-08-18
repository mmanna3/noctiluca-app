import { carpetasDb, encolarOperacion, escritosDb } from "./db";
import { nuevoId } from "./ids";
import { compactar } from "./outbox";
import { sincronizarPronto } from "./sync-engine";
import { CarpetaLocal, OperacionOutbox } from "./tipos";

/** Payload de upsert de carpeta que espera el backend (CarpetaSyncPayload). */
const payloadDeCarpeta = (c: CarpetaLocal, carpetaPadreClientId?: string) => ({
	titulo: c.titulo,
	requiereAutenticacion: c.requiereAutenticacion ?? false,
	posicion: c.posicion ?? 0,
	criterioDeOrden: c.criterioDeOrden ?? 1,
	carpetaPadreClientId,
	propositoCarpeta: c.propositoCarpeta,
});

/**
 * Alta offline de una carpeta (o subcarpeta). Devuelve el clientId.
 * `carpetaPadreClientId` permite anidar bajo una carpeta creada offline que
 * todavía no tiene `serverId` asignado (aún no sincronizó).
 */
export const crearCarpetaLocal = async (params: {
	titulo: string;
	carpetaPadreId?: number;
	carpetaPadreClientId?: string;
}): Promise<string> => {
	const clientId = nuevoId();

	const carpetaPadreClientId =
		params.carpetaPadreClientId ??
		(params.carpetaPadreId !== undefined
			? (await carpetasDb.porServerId(params.carpetaPadreId))?.clientId
			: undefined);

	const esRaiz = params.carpetaPadreId === undefined && carpetaPadreClientId === undefined;
	const todas = await carpetasDb.todas();
	const hermanas = todas.filter((c) =>
		esRaiz
			? c.carpetaPadreId === undefined || c.carpetaPadreId === null
			: (params.carpetaPadreId !== undefined && c.carpetaPadreId === params.carpetaPadreId) ||
				(carpetaPadreClientId !== undefined && c.carpetaPadreClientId === carpetaPadreClientId),
	);
	const posicion = hermanas.reduce((max, c) => Math.max(max, c.posicion ?? 0), 0) + 1;

	const carpeta: CarpetaLocal = {
		clientId,
		titulo: params.titulo,
		version: 0,
		posicion,
		criterioDeOrden: 1,
		carpetaPadreId: params.carpetaPadreId,
		carpetaPadreClientId,
		esSistema: false,
		requiereAutenticacion: false,
		pendiente: true,
	};

	await carpetasDb.put(carpeta);
	await encolarOperacion(clientId, compactar, {
		clientOpId: nuevoId(),
		entityType: "carpeta",
		operation: "upsert",
		clientEntityId: clientId,
		clientTimestamp: new Date().toISOString(),
		payload: payloadDeCarpeta(carpeta, carpetaPadreClientId),
		intentos: 0,
	});

	void sincronizarPronto();
	return clientId;
};

/** Borra una carpeta (y limpia localmente sus descendientes), offline-first. */
export const eliminarCarpetaLocal = async (clientId: string): Promise<void> => {
	const carpeta = await carpetasDb.porClientId(clientId);
	if (!carpeta) return;

	// Recolectar subcarpetas descendientes (por serverId) para limpieza local.
	const todas = await carpetasDb.todas();
	const aBorrar = new Set<string>([clientId]);
	let cambio = true;
	while (cambio) {
		cambio = false;
		for (const c of todas) {
			const padre = todas.find((p) => p.serverId === c.carpetaPadreId);
			if (padre && aBorrar.has(padre.clientId) && !aBorrar.has(c.clientId)) {
				aBorrar.add(c.clientId);
				cambio = true;
			}
		}
	}

	const escritos = await escritosDb.todos();
	for (const e of escritos) {
		const perteneceABorrada =
			(e.carpetaClientId !== undefined && aBorrar.has(e.carpetaClientId)) ||
			todas.some((c) => aBorrar.has(c.clientId) && c.serverId === e.carpetaId);
		if (perteneceABorrada) await escritosDb.delete(e.clientId);
	}

	for (const id of aBorrar) await carpetasDb.delete(id);

	await encolarOperacion(clientId, compactar, {
		clientOpId: nuevoId(),
		entityType: "carpeta",
		operation: "delete",
		clientEntityId: clientId,
		baseVersion: carpeta.version,
		clientTimestamp: new Date().toISOString(),
		payload: {},
		intentos: 0,
	});

	void sincronizarPronto();
};
