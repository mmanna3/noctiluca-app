import { encolarOperacion, registrosHabitoDb } from "./db";
import { fechaClave } from "./fechas";
import { nuevoId } from "./ids";
import { compactar } from "./outbox";
import { sincronizarPronto } from "./sync-engine";
import { OperacionOutbox } from "./tipos";

/** Guarda (o actualiza) el registro de un hábito para un día, offline-first. */
export const guardarRegistroHabitoLocal = async (params: {
	habitoClientId: string;
	habitoId?: number;
	fecha: Date;
	valorBooleano?: boolean;
	valorNumerico?: number;
}): Promise<void> => {
	const clave = fechaClave(params.fecha);
	const clientTimestamp = new Date().toISOString();

	const existente = await registrosHabitoDb.porHabitoYFecha(params.habitoClientId, clave);
	const clientId = existente?.clientId ?? nuevoId();

	await registrosHabitoDb.put({
		clientId,
		serverId: existente?.serverId,
		habitoClientId: params.habitoClientId,
		habitoId: params.habitoId ?? existente?.habitoId,
		fecha: clave,
		valorBooleano: params.valorBooleano,
		valorNumerico: params.valorNumerico,
		version: existente?.version ?? 0,
		pendiente: true,
	});

	const op: OperacionOutbox = {
		clientOpId: nuevoId(),
		entityType: "registroHabito",
		operation: "upsert",
		clientEntityId: clientId,
		baseVersion: existente?.version,
		clientTimestamp,
		payload: {
			habitoClientId: params.habitoClientId,
			fecha: clave,
			valorBooleano: params.valorBooleano,
			valorNumerico: params.valorNumerico,
		},
		intentos: 0,
	};
	await encolarOperacion(clientId, compactar, op);

	void sincronizarPronto();
};
