export type TipoEntidadSync =
	| "escrito"
	| "carpeta"
	| "habito"
	| "registroHabito"
	| "itemObjetivo";

export type OperacionSync = "upsert" | "delete";

/** Operación pendiente en el outbox, esperando ser enviada al servidor. */
export interface OperacionOutbox {
	clientOpId: string;
	entityType: TipoEntidadSync;
	operation: OperacionSync;
	clientEntityId: string;
	baseVersion?: number;
	clientTimestamp: string;
	payload: unknown;
	intentos: number;
	/** Marcada como fallo permanente (ej. validación 4xx): no se reintenta sola. */
	muerta?: boolean;
}

/** Copia local de un escrito (fuente de verdad offline). */
export interface EscritoLocal {
	clientId: string;
	serverId?: number;
	titulo: string;
	cuerpo: string;
	carpetaClientId?: string;
	carpetaId?: number;
	version: number;
	actualizadoEn?: string;
	fechaHoraCreacion?: string;
	fechaHoraEdicion?: string;
	estaEnPapelera?: boolean;
	/** Tiene cambios locales aún no confirmados por el servidor. */
	pendiente?: boolean;
}

/** Copia local de una carpeta. */
export interface CarpetaLocal {
	clientId: string;
	serverId?: number;
	titulo: string;
	version: number;
	posicion?: number;
	criterioDeOrden?: number;
	carpetaPadreId?: number;
	carpetaPadreClientId?: string;
	esSistema?: boolean;
	requiereAutenticacion?: boolean;
	propositoCarpeta?: number;
	/** Tiene cambios locales aún no confirmados por el servidor. */
	pendiente?: boolean;
}

/** Copia local de un hábito. */
export interface HabitoLocal {
	clientId: string;
	serverId?: number;
	nombre: string;
	tipo: number;
	activo: boolean;
	posicion: number;
	metaMinutos?: number;
	version: number;
	pendiente?: boolean;
}

/** Registro diario de un hábito (clave natural: hábito + fecha). */
export interface RegistroHabitoLocal {
	clientId: string;
	serverId?: number;
	habitoClientId: string;
	habitoId?: number;
	/** YYYY-MM-DD */
	fecha: string;
	valorBooleano?: boolean;
	valorNumerico?: number;
	version: number;
	pendiente?: boolean;
}

/** Metadatos de una lista de objetivos (ítems en tabla aparte). */
export interface ListaObjetivoLocal {
	clientId: string;
	serverId?: number;
	tipo: number;
	clavePeriodo: string;
	fechaInicio?: string;
	fechaFin?: string;
	fechaCreacion?: string;
	version: number;
}

/** Ítem de una lista de objetivos. */
export interface ItemObjetivoLocal {
	clientId: string;
	serverId?: number;
	listaTipo: number;
	listaClavePeriodo: string;
	texto: string;
	completado: boolean;
	posicion: number;
	fechaCompletado?: string;
	version: number;
	pendiente?: boolean;
}

export type EstadoGuardado = "guardado" | "guardando" | "pendiente" | "sin-conexion" | "error";
