import { carpetasDb, encolarOperacion, escritosDb } from "./db";
import { nuevoId } from "./ids";
import { compactar } from "./outbox";
import { sincronizarPronto } from "./sync-engine";
import { OperacionOutbox } from "./tipos";

/**
 * Alta offline de un escrito: genera su GUID, lo persiste localmente (queda
 * visible de inmediato en la carpeta) y encola su upsert. Devuelve el
 * clientId para navegar.
 */
export const crearEscritoLocal = async (params: {
	titulo: string;
	cuerpo: string;
	carpetaClientId?: string;
	carpetaId?: number;
}): Promise<string> => {
	const clientId = nuevoId();
	const ahora = new Date().toISOString();

	const carpetaClientId =
		params.carpetaClientId ??
		(params.carpetaId !== undefined ? (await carpetasDb.porServerId(params.carpetaId))?.clientId : undefined);

	await escritosDb.put({
		clientId,
		titulo: params.titulo,
		cuerpo: params.cuerpo,
		carpetaClientId,
		carpetaId: params.carpetaId,
		version: 0,
		fechaHoraCreacion: ahora,
		fechaHoraEdicion: ahora,
		estaEnPapelera: false,
		pendiente: true,
	});

	const op: OperacionOutbox = {
		clientOpId: nuevoId(),
		entityType: "escrito",
		operation: "upsert",
		clientEntityId: clientId,
		clientTimestamp: ahora,
		payload: {
			titulo: params.titulo,
			cuerpo: params.cuerpo,
			carpetaClientId,
			estaEnPapelera: false,
			fechaHoraCreacion: ahora,
		},
		intentos: 0,
	};
	await encolarOperacion(clientId, compactar, op);

	void sincronizarPronto();
	return clientId;
};

/**
 * Autoguardado: persiste el escrito en local y encola (compactando) una
 * operación de upsert en el outbox, luego dispara la sincronización.
 */
export const guardarEscritoLocal = async (params: {
	clientId: string;
	titulo: string;
	cuerpo: string;
	carpetaClientId?: string;
	carpetaId?: number;
}): Promise<void> => {
	const clientTimestamp = new Date().toISOString();
	const actual = await escritosDb.porClientId(params.clientId);
	const carpetaClientId = params.carpetaClientId ?? actual?.carpetaClientId;

	await escritosDb.put({
		clientId: params.clientId,
		serverId: actual?.serverId,
		titulo: params.titulo,
		cuerpo: params.cuerpo,
		carpetaClientId,
		carpetaId: params.carpetaId ?? actual?.carpetaId,
		version: actual?.version ?? 0,
		fechaHoraCreacion: actual?.fechaHoraCreacion,
		fechaHoraEdicion: clientTimestamp,
		estaEnPapelera: actual?.estaEnPapelera ?? false,
		pendiente: true,
	});

	const op: OperacionOutbox = {
		clientOpId: nuevoId(),
		entityType: "escrito",
		operation: "upsert",
		clientEntityId: params.clientId,
		baseVersion: actual?.version,
		clientTimestamp,
		payload: {
			titulo: params.titulo,
			cuerpo: params.cuerpo,
			carpetaClientId,
			estaEnPapelera: actual?.estaEnPapelera ?? false,
		},
		intentos: 0,
	};
	await encolarOperacion(params.clientId, compactar, op);

	void sincronizarPronto();
};

/** Manda un escrito a la papelera (o lo restaura), offline-first. */
export const cambiarPapeleraLocal = async (clientId: string, estaEnPapelera: boolean): Promise<void> => {
	const clientTimestamp = new Date().toISOString();
	const actual = await escritosDb.porClientId(clientId);
	if (!actual) return;

	await escritosDb.put({
		...actual,
		estaEnPapelera,
		fechaHoraEdicion: clientTimestamp,
		pendiente: true,
	});

	const op: OperacionOutbox = {
		clientOpId: nuevoId(),
		entityType: "escrito",
		operation: "upsert",
		clientEntityId: clientId,
		baseVersion: actual.version,
		clientTimestamp,
		payload: {
			titulo: actual.titulo,
			cuerpo: actual.cuerpo,
			carpetaClientId: actual.carpetaClientId,
			estaEnPapelera,
		},
		intentos: 0,
	};
	await encolarOperacion(clientId, compactar, op);

	void sincronizarPronto();
};
