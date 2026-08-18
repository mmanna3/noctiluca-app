import * as SQLite from "expo-sqlite";
import { nuevoId } from "./ids";
import {
	CarpetaLocal,
	EscritoLocal,
	HabitoLocal,
	ItemObjetivoLocal,
	ListaObjetivoLocal,
	OperacionOutbox,
	RegistroHabitoLocal,
} from "./tipos";

/**
 * Base local (SQLite) de la app. Es la fuente de verdad offline: la UI lee de
 * acá (vía `lecturas.ts`) y el motor de sync (`sync-engine.ts`) la mantiene
 * actualizada contra el backend.
 *
 * Usa la API *Async de expo-sqlite (no *Sync): en web, *Sync corre sobre un
 * Worker + WASM (wa-sqlite) coordinado con SharedArrayBuffer/Atomics, y la
 * primera llamada puede tardar más que el timeout fijo de esa vía y tirar
 * "Sync operation timeout". La API async no tiene ese problema y funciona
 * igual en iOS.
 */
const ESQUEMA = `
	CREATE TABLE IF NOT EXISTS escritos (
		clientId TEXT PRIMARY KEY,
		serverId INTEGER,
		titulo TEXT NOT NULL,
		cuerpo TEXT,
		carpetaClientId TEXT,
		carpetaId INTEGER,
		version INTEGER NOT NULL DEFAULT 0,
		actualizadoEn TEXT,
		fechaHoraCreacion TEXT,
		fechaHoraEdicion TEXT,
		estaEnPapelera INTEGER DEFAULT 0,
		pendiente INTEGER DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS carpetas (
		clientId TEXT PRIMARY KEY,
		serverId INTEGER,
		titulo TEXT NOT NULL,
		version INTEGER NOT NULL DEFAULT 0,
		posicion INTEGER,
		criterioDeOrden INTEGER,
		carpetaPadreId INTEGER,
		carpetaPadreClientId TEXT,
		esSistema INTEGER DEFAULT 0,
		requiereAutenticacion INTEGER DEFAULT 0,
		propositoCarpeta INTEGER,
		pendiente INTEGER DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS habitos (
		clientId TEXT PRIMARY KEY,
		serverId INTEGER,
		nombre TEXT NOT NULL,
		tipo INTEGER NOT NULL,
		activo INTEGER DEFAULT 1,
		posicion INTEGER NOT NULL DEFAULT 0,
		metaMinutos INTEGER,
		version INTEGER NOT NULL DEFAULT 0,
		pendiente INTEGER DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS registrosHabito (
		clientId TEXT PRIMARY KEY,
		serverId INTEGER,
		habitoClientId TEXT NOT NULL,
		habitoId INTEGER,
		fecha TEXT NOT NULL,
		valorBooleano INTEGER,
		valorNumerico INTEGER,
		version INTEGER NOT NULL DEFAULT 0,
		pendiente INTEGER DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS outbox (
		clientOpId TEXT PRIMARY KEY,
		entityType TEXT NOT NULL,
		operation TEXT NOT NULL,
		clientEntityId TEXT NOT NULL,
		baseVersion INTEGER,
		clientTimestamp TEXT NOT NULL,
		payload TEXT NOT NULL,
		intentos INTEGER NOT NULL DEFAULT 0,
		muerta INTEGER DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS listasObjetivo (
		clientId TEXT PRIMARY KEY,
		serverId INTEGER,
		tipo INTEGER NOT NULL,
		clavePeriodo TEXT NOT NULL,
		fechaInicio TEXT,
		fechaFin TEXT,
		fechaCreacion TEXT,
		version INTEGER NOT NULL DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS itemsObjetivo (
		clientId TEXT PRIMARY KEY,
		serverId INTEGER,
		listaTipo INTEGER NOT NULL,
		listaClavePeriodo TEXT NOT NULL,
		texto TEXT NOT NULL,
		completado INTEGER DEFAULT 0,
		posicion INTEGER NOT NULL DEFAULT 0,
		fechaCompletado TEXT,
		version INTEGER NOT NULL DEFAULT 0,
		pendiente INTEGER DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS meta (
		clave TEXT PRIMARY KEY,
		valor TEXT NOT NULL
	);
`;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const obtenerDb = (): Promise<SQLite.SQLiteDatabase> => {
	if (!dbPromise) {
		dbPromise = SQLite.openDatabaseAsync("noctiluca.db").then(async (db) => {
			await db.execAsync(ESQUEMA);
			return db;
		});
	}
	return dbPromise;
};

/** Emisor en memoria: cada escritura local avisa a los suscriptores (`useLiveQuery`). */
type Escuchador = () => void;
const escuchadores = new Set<Escuchador>();

export const notificarCambio = (): void => {
	for (const escuchar of escuchadores) escuchar();
};

export const suscribirseACambios = (escuchar: Escuchador): (() => void) => {
	escuchadores.add(escuchar);
	return () => escuchadores.delete(escuchar);
};

const bool = (v: number | null): boolean | undefined => (v == null ? undefined : v !== 0);
const aInt = (v: boolean | undefined): number => (v ? 1 : 0);

interface EscritoRow {
	clientId: string;
	serverId: number | null;
	titulo: string;
	cuerpo: string | null;
	carpetaClientId: string | null;
	carpetaId: number | null;
	version: number;
	fechaHoraCreacion: string | null;
	fechaHoraEdicion: string | null;
	estaEnPapelera: number | null;
	pendiente: number | null;
}

const escritoDesdeRow = (r: EscritoRow): EscritoLocal => ({
	clientId: r.clientId,
	serverId: r.serverId ?? undefined,
	titulo: r.titulo,
	cuerpo: r.cuerpo ?? "",
	carpetaClientId: r.carpetaClientId ?? undefined,
	carpetaId: r.carpetaId ?? undefined,
	version: r.version,
	fechaHoraCreacion: r.fechaHoraCreacion ?? undefined,
	fechaHoraEdicion: r.fechaHoraEdicion ?? undefined,
	estaEnPapelera: bool(r.estaEnPapelera),
	pendiente: bool(r.pendiente),
});

export const escritosDb = {
	todos: async (): Promise<EscritoLocal[]> => {
		const db = await obtenerDb();
		return (await db.getAllAsync<EscritoRow>("SELECT * FROM escritos")).map(escritoDesdeRow);
	},
	porClientId: async (clientId: string): Promise<EscritoLocal | undefined> => {
		const db = await obtenerDb();
		const fila = await db.getFirstAsync<EscritoRow>("SELECT * FROM escritos WHERE clientId = ?", clientId);
		return fila ? escritoDesdeRow(fila) : undefined;
	},
	porServerId: async (serverId: number): Promise<EscritoLocal | undefined> => {
		const db = await obtenerDb();
		const fila = await db.getFirstAsync<EscritoRow>("SELECT * FROM escritos WHERE serverId = ?", serverId);
		return fila ? escritoDesdeRow(fila) : undefined;
	},
	put: async (e: EscritoLocal): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync(
			`INSERT INTO escritos (clientId, serverId, titulo, cuerpo, carpetaClientId, carpetaId, version, fechaHoraCreacion, fechaHoraEdicion, estaEnPapelera, pendiente)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(clientId) DO UPDATE SET
				serverId = excluded.serverId,
				titulo = excluded.titulo,
				cuerpo = excluded.cuerpo,
				carpetaClientId = excluded.carpetaClientId,
				carpetaId = excluded.carpetaId,
				version = excluded.version,
				fechaHoraCreacion = excluded.fechaHoraCreacion,
				fechaHoraEdicion = excluded.fechaHoraEdicion,
				estaEnPapelera = excluded.estaEnPapelera,
				pendiente = excluded.pendiente`,
			e.clientId,
			e.serverId ?? null,
			e.titulo,
			e.cuerpo ?? "",
			e.carpetaClientId ?? null,
			e.carpetaId ?? null,
			e.version,
			e.fechaHoraCreacion ?? null,
			e.fechaHoraEdicion ?? null,
			aInt(e.estaEnPapelera),
			aInt(e.pendiente),
		);
		notificarCambio();
	},
	delete: async (clientId: string): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync("DELETE FROM escritos WHERE clientId = ?", clientId);
		notificarCambio();
	},
};

interface CarpetaRow {
	clientId: string;
	serverId: number | null;
	titulo: string;
	version: number;
	posicion: number | null;
	criterioDeOrden: number | null;
	carpetaPadreId: number | null;
	carpetaPadreClientId: string | null;
	esSistema: number | null;
	requiereAutenticacion: number | null;
	propositoCarpeta: number | null;
	pendiente: number | null;
}

const carpetaDesdeRow = (r: CarpetaRow): CarpetaLocal => ({
	clientId: r.clientId,
	serverId: r.serverId ?? undefined,
	titulo: r.titulo,
	version: r.version,
	posicion: r.posicion ?? undefined,
	criterioDeOrden: r.criterioDeOrden ?? undefined,
	carpetaPadreId: r.carpetaPadreId ?? undefined,
	carpetaPadreClientId: r.carpetaPadreClientId ?? undefined,
	esSistema: bool(r.esSistema),
	requiereAutenticacion: bool(r.requiereAutenticacion),
	propositoCarpeta: r.propositoCarpeta ?? undefined,
	pendiente: bool(r.pendiente),
});

export const carpetasDb = {
	todas: async (): Promise<CarpetaLocal[]> => {
		const db = await obtenerDb();
		return (await db.getAllAsync<CarpetaRow>("SELECT * FROM carpetas")).map(carpetaDesdeRow);
	},
	porClientId: async (clientId: string): Promise<CarpetaLocal | undefined> => {
		const db = await obtenerDb();
		const fila = await db.getFirstAsync<CarpetaRow>("SELECT * FROM carpetas WHERE clientId = ?", clientId);
		return fila ? carpetaDesdeRow(fila) : undefined;
	},
	porServerId: async (serverId: number): Promise<CarpetaLocal | undefined> => {
		const db = await obtenerDb();
		const fila = await db.getFirstAsync<CarpetaRow>("SELECT * FROM carpetas WHERE serverId = ?", serverId);
		return fila ? carpetaDesdeRow(fila) : undefined;
	},
	put: async (c: CarpetaLocal): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync(
			`INSERT INTO carpetas (clientId, serverId, titulo, version, posicion, criterioDeOrden, carpetaPadreId, carpetaPadreClientId, esSistema, requiereAutenticacion, propositoCarpeta, pendiente)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(clientId) DO UPDATE SET
				serverId = excluded.serverId,
				titulo = excluded.titulo,
				version = excluded.version,
				posicion = excluded.posicion,
				criterioDeOrden = excluded.criterioDeOrden,
				carpetaPadreId = excluded.carpetaPadreId,
				carpetaPadreClientId = excluded.carpetaPadreClientId,
				esSistema = excluded.esSistema,
				requiereAutenticacion = excluded.requiereAutenticacion,
				propositoCarpeta = excluded.propositoCarpeta,
				pendiente = excluded.pendiente`,
			c.clientId,
			c.serverId ?? null,
			c.titulo,
			c.version,
			c.posicion ?? null,
			c.criterioDeOrden ?? null,
			c.carpetaPadreId ?? null,
			c.carpetaPadreClientId ?? null,
			aInt(c.esSistema),
			aInt(c.requiereAutenticacion),
			c.propositoCarpeta ?? null,
			aInt(c.pendiente),
		);
		notificarCambio();
	},
	delete: async (clientId: string): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync("DELETE FROM carpetas WHERE clientId = ?", clientId);
		notificarCambio();
	},
};

interface HabitoRow {
	clientId: string;
	serverId: number | null;
	nombre: string;
	tipo: number;
	activo: number | null;
	posicion: number;
	metaMinutos: number | null;
	version: number;
	pendiente: number | null;
}

const habitoDesdeRow = (r: HabitoRow): HabitoLocal => ({
	clientId: r.clientId,
	serverId: r.serverId ?? undefined,
	nombre: r.nombre,
	tipo: r.tipo,
	activo: bool(r.activo) ?? true,
	posicion: r.posicion,
	metaMinutos: r.metaMinutos ?? undefined,
	version: r.version,
	pendiente: bool(r.pendiente),
});

export const habitosDb = {
	todos: async (): Promise<HabitoLocal[]> => {
		const db = await obtenerDb();
		return (await db.getAllAsync<HabitoRow>("SELECT * FROM habitos")).map(habitoDesdeRow);
	},
	porClientId: async (clientId: string): Promise<HabitoLocal | undefined> => {
		const db = await obtenerDb();
		const fila = await db.getFirstAsync<HabitoRow>("SELECT * FROM habitos WHERE clientId = ?", clientId);
		return fila ? habitoDesdeRow(fila) : undefined;
	},
	put: async (h: HabitoLocal): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync(
			`INSERT INTO habitos (clientId, serverId, nombre, tipo, activo, posicion, metaMinutos, version, pendiente)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(clientId) DO UPDATE SET
				serverId = excluded.serverId,
				nombre = excluded.nombre,
				tipo = excluded.tipo,
				activo = excluded.activo,
				posicion = excluded.posicion,
				metaMinutos = excluded.metaMinutos,
				version = excluded.version,
				pendiente = excluded.pendiente`,
			h.clientId,
			h.serverId ?? null,
			h.nombre,
			h.tipo,
			aInt(h.activo),
			h.posicion,
			h.metaMinutos ?? null,
			h.version,
			aInt(h.pendiente),
		);
		notificarCambio();
	},
	delete: async (clientId: string): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync("DELETE FROM habitos WHERE clientId = ?", clientId);
		notificarCambio();
	},
};

interface RegistroHabitoRow {
	clientId: string;
	serverId: number | null;
	habitoClientId: string;
	habitoId: number | null;
	fecha: string;
	valorBooleano: number | null;
	valorNumerico: number | null;
	version: number;
	pendiente: number | null;
}

const registroDesdeRow = (r: RegistroHabitoRow): RegistroHabitoLocal => ({
	clientId: r.clientId,
	serverId: r.serverId ?? undefined,
	habitoClientId: r.habitoClientId,
	habitoId: r.habitoId ?? undefined,
	fecha: r.fecha,
	valorBooleano: bool(r.valorBooleano),
	valorNumerico: r.valorNumerico ?? undefined,
	version: r.version,
	pendiente: bool(r.pendiente),
});

export const registrosHabitoDb = {
	todos: async (): Promise<RegistroHabitoLocal[]> => {
		const db = await obtenerDb();
		return (await db.getAllAsync<RegistroHabitoRow>("SELECT * FROM registrosHabito")).map(registroDesdeRow);
	},
	porHabitoYFecha: async (habitoClientId: string, fecha: string): Promise<RegistroHabitoLocal | undefined> => {
		const db = await obtenerDb();
		const fila = await db.getFirstAsync<RegistroHabitoRow>(
			"SELECT * FROM registrosHabito WHERE habitoClientId = ? AND fecha = ?",
			habitoClientId,
			fecha,
		);
		return fila ? registroDesdeRow(fila) : undefined;
	},
	put: async (r: RegistroHabitoLocal): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync(
			`INSERT INTO registrosHabito (clientId, serverId, habitoClientId, habitoId, fecha, valorBooleano, valorNumerico, version, pendiente)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(clientId) DO UPDATE SET
				serverId = excluded.serverId,
				habitoClientId = excluded.habitoClientId,
				habitoId = excluded.habitoId,
				fecha = excluded.fecha,
				valorBooleano = excluded.valorBooleano,
				valorNumerico = excluded.valorNumerico,
				version = excluded.version,
				pendiente = excluded.pendiente`,
			r.clientId,
			r.serverId ?? null,
			r.habitoClientId,
			r.habitoId ?? null,
			r.fecha,
			r.valorBooleano == null ? null : aInt(r.valorBooleano),
			r.valorNumerico ?? null,
			r.version,
			aInt(r.pendiente),
		);
		notificarCambio();
	},
	deletePorHabito: async (habitoClientId: string): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync("DELETE FROM registrosHabito WHERE habitoClientId = ?", habitoClientId);
		notificarCambio();
	},
};

interface ListaObjetivoRow {
	clientId: string;
	serverId: number | null;
	tipo: number;
	clavePeriodo: string;
	fechaInicio: string | null;
	fechaFin: string | null;
	fechaCreacion: string | null;
	version: number;
}

const listaObjetivoDesdeRow = (r: ListaObjetivoRow): ListaObjetivoLocal => ({
	clientId: r.clientId,
	serverId: r.serverId ?? undefined,
	tipo: r.tipo,
	clavePeriodo: r.clavePeriodo,
	fechaInicio: r.fechaInicio ?? undefined,
	fechaFin: r.fechaFin ?? undefined,
	fechaCreacion: r.fechaCreacion ?? undefined,
	version: r.version,
});

export const listasObjetivoDb = {
	todas: async (): Promise<ListaObjetivoLocal[]> => {
		const db = await obtenerDb();
		return (await db.getAllAsync<ListaObjetivoRow>("SELECT * FROM listasObjetivo")).map(listaObjetivoDesdeRow);
	},
	put: async (l: ListaObjetivoLocal): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync(
			`INSERT INTO listasObjetivo (clientId, serverId, tipo, clavePeriodo, fechaInicio, fechaFin, fechaCreacion, version)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(clientId) DO UPDATE SET
				serverId = excluded.serverId,
				tipo = excluded.tipo,
				clavePeriodo = excluded.clavePeriodo,
				fechaInicio = excluded.fechaInicio,
				fechaFin = excluded.fechaFin,
				fechaCreacion = excluded.fechaCreacion,
				version = excluded.version`,
			l.clientId,
			l.serverId ?? null,
			l.tipo,
			l.clavePeriodo,
			l.fechaInicio ?? null,
			l.fechaFin ?? null,
			l.fechaCreacion ?? null,
			l.version,
		);
		notificarCambio();
	},
};

interface ItemObjetivoRow {
	clientId: string;
	serverId: number | null;
	listaTipo: number;
	listaClavePeriodo: string;
	texto: string;
	completado: number | null;
	posicion: number;
	fechaCompletado: string | null;
	version: number;
	pendiente: number | null;
}

const itemObjetivoDesdeRow = (r: ItemObjetivoRow): ItemObjetivoLocal => ({
	clientId: r.clientId,
	serverId: r.serverId ?? undefined,
	listaTipo: r.listaTipo,
	listaClavePeriodo: r.listaClavePeriodo,
	texto: r.texto,
	completado: bool(r.completado) ?? false,
	posicion: r.posicion,
	fechaCompletado: r.fechaCompletado ?? undefined,
	version: r.version,
	pendiente: bool(r.pendiente),
});

export const itemsObjetivoDb = {
	todos: async (): Promise<ItemObjetivoLocal[]> => {
		const db = await obtenerDb();
		return (await db.getAllAsync<ItemObjetivoRow>("SELECT * FROM itemsObjetivo")).map(itemObjetivoDesdeRow);
	},
	porClientId: async (clientId: string): Promise<ItemObjetivoLocal | undefined> => {
		const db = await obtenerDb();
		const fila = await db.getFirstAsync<ItemObjetivoRow>("SELECT * FROM itemsObjetivo WHERE clientId = ?", clientId);
		return fila ? itemObjetivoDesdeRow(fila) : undefined;
	},
	put: async (i: ItemObjetivoLocal): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync(
			`INSERT INTO itemsObjetivo (clientId, serverId, listaTipo, listaClavePeriodo, texto, completado, posicion, fechaCompletado, version, pendiente)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(clientId) DO UPDATE SET
				serverId = excluded.serverId,
				listaTipo = excluded.listaTipo,
				listaClavePeriodo = excluded.listaClavePeriodo,
				texto = excluded.texto,
				completado = excluded.completado,
				posicion = excluded.posicion,
				fechaCompletado = excluded.fechaCompletado,
				version = excluded.version,
				pendiente = excluded.pendiente`,
			i.clientId,
			i.serverId ?? null,
			i.listaTipo,
			i.listaClavePeriodo,
			i.texto,
			aInt(i.completado),
			i.posicion,
			i.fechaCompletado ?? null,
			i.version,
			aInt(i.pendiente),
		);
		notificarCambio();
	},
	delete: async (clientId: string): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync("DELETE FROM itemsObjetivo WHERE clientId = ?", clientId);
		notificarCambio();
	},
};

const filaAOperacion = (f: {
	clientOpId: string;
	entityType: string;
	operation: string;
	clientEntityId: string;
	baseVersion: number | null;
	clientTimestamp: string;
	payload: string;
	intentos: number;
	muerta: number | null;
}): OperacionOutbox => ({
	clientOpId: f.clientOpId,
	entityType: f.entityType as OperacionOutbox["entityType"],
	operation: f.operation as OperacionOutbox["operation"],
	clientEntityId: f.clientEntityId,
	baseVersion: f.baseVersion ?? undefined,
	clientTimestamp: f.clientTimestamp,
	payload: JSON.parse(f.payload),
	intentos: f.intentos,
	muerta: bool(f.muerta),
});

type OutboxRow = {
	clientOpId: string;
	entityType: string;
	operation: string;
	clientEntityId: string;
	baseVersion: number | null;
	clientTimestamp: string;
	payload: string;
	intentos: number;
	muerta: number | null;
};

export const outboxDb = {
	todas: async (): Promise<OperacionOutbox[]> => {
		const db = await obtenerDb();
		return (await db.getAllAsync<OutboxRow>("SELECT * FROM outbox")).map(filaAOperacion);
	},
	porEntidad: async (clientEntityId: string): Promise<OperacionOutbox[]> => {
		const db = await obtenerDb();
		return (
			await db.getAllAsync<OutboxRow>("SELECT * FROM outbox WHERE clientEntityId = ?", clientEntityId)
		).map(filaAOperacion);
	},
	contarActivas: async (): Promise<number> => {
		const db = await obtenerDb();
		const fila = await db.getFirstAsync<{ total: number }>(
			"SELECT COUNT(*) as total FROM outbox WHERE muerta IS NULL OR muerta = 0",
		);
		return fila?.total ?? 0;
	},
	put: async (o: OperacionOutbox): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync(
			`INSERT INTO outbox (clientOpId, entityType, operation, clientEntityId, baseVersion, clientTimestamp, payload, intentos, muerta)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(clientOpId) DO UPDATE SET
				entityType = excluded.entityType,
				operation = excluded.operation,
				clientEntityId = excluded.clientEntityId,
				baseVersion = excluded.baseVersion,
				clientTimestamp = excluded.clientTimestamp,
				payload = excluded.payload,
				intentos = excluded.intentos,
				muerta = excluded.muerta`,
			o.clientOpId,
			o.entityType,
			o.operation,
			o.clientEntityId,
			o.baseVersion ?? null,
			o.clientTimestamp,
			JSON.stringify(o.payload ?? {}),
			o.intentos,
			aInt(o.muerta),
		);
	},
	deletePorEntidad: async (clientEntityId: string): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync("DELETE FROM outbox WHERE clientEntityId = ?", clientEntityId);
	},
	delete: async (clientOpId: string): Promise<void> => {
		const db = await obtenerDb();
		await db.runAsync("DELETE FROM outbox WHERE clientOpId = ?", clientOpId);
	},
};

/** Encola (compactando con lo pendiente de la misma entidad) una operación y notifica. */
export const encolarOperacion = async (
	clientEntityId: string,
	compactar: (pendientes: OperacionOutbox[], nueva: OperacionOutbox) => OperacionOutbox[],
	nueva: OperacionOutbox,
): Promise<void> => {
	const pendientes = await outboxDb.porEntidad(clientEntityId);
	const compactadas = compactar(pendientes, nueva);
	await outboxDb.deletePorEntidad(clientEntityId);
	for (const op of compactadas) await outboxDb.put(op);
	notificarCambio();
};

const CLAVE_CURSOR = "cursor";
const CLAVE_DEVICE_ID = "deviceId";

const leerMeta = async (clave: string): Promise<string | undefined> => {
	const db = await obtenerDb();
	const fila = await db.getFirstAsync<{ valor: string }>("SELECT valor FROM meta WHERE clave = ?", clave);
	return fila?.valor;
};

const guardarMeta = async (clave: string, valor: string): Promise<void> => {
	const db = await obtenerDb();
	await db.runAsync(
		"INSERT INTO meta (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor",
		clave,
		valor,
	);
};

export const leerCursor = async (): Promise<number> => Number((await leerMeta(CLAVE_CURSOR)) ?? "0");

export const guardarCursor = (cursor: number): Promise<void> => guardarMeta(CLAVE_CURSOR, String(cursor));

/** Id estable de este dispositivo/instalación (se genera una sola vez). */
export const obtenerDeviceId = async (): Promise<string> => {
	const existente = await leerMeta(CLAVE_DEVICE_ID);
	if (existente) return existente;
	const id = nuevoId();
	await guardarMeta(CLAVE_DEVICE_ID, id);
	return id;
};
