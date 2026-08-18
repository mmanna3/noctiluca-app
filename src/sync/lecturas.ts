import { CarpetaDTO, EscritoDTO } from "@/api/clients";
import { carpetasDb, escritosDb, habitosDb, registrosHabitoDb } from "./db";
import {
	aEscritoDTO,
	carpetaDesde,
	carpetasRaizDesde,
	TrackerHabitoView,
	trackerDiaDesde,
} from "./lecturas-core";
import { CarpetaLocal } from "./tipos";
import { useLiveQuery } from "./use-live-query";

/**
 * Capa de lectura offline-first: reconstruye los DTOs que la UI ya consume
 * (`CarpetaDTO`/`EscritoDTO`) a partir de la base local (SQLite), de forma
 * reactiva con `useLiveQuery`. La fuente de verdad es SQLite; el motor de sync
 * la mantiene al día contra el backend. La lógica pura de reconstrucción vive
 * en `lecturas-core.ts`.
 */

/** Carpetas raíz (para el Inicio), ordenadas por posición, con sus conteos. */
export const useCarpetasRaiz = (): CarpetaDTO[] | undefined =>
	useLiveQuery(async () => {
		const [carpetas, escritos] = await Promise.all([carpetasDb.todas(), escritosDb.todos()]);
		return carpetasRaizDesde(carpetas, escritos);
	}, []);

/** Detalle de una carpeta por su id de servidor, o su clientId si aún no fue sincronizada. */
export const useCarpeta = (idOClientId: number | string | undefined): CarpetaDTO | undefined | null =>
	useLiveQuery(async () => {
		const [carpetas, escritos] = await Promise.all([carpetasDb.todas(), escritosDb.todos()]);
		return carpetaDesde(idOClientId, carpetas, escritos);
	}, [idOClientId]);

/** Todas las carpetas locales (crudas), para evaluar accesos a carpetas privadas. */
export const useTodasLasCarpetasLocal = (): CarpetaLocal[] | undefined =>
	useLiveQuery(() => carpetasDb.todas(), []);

/** Un escrito por su clientId (GUID) o su id de servidor. */
export const useEscrito = (idOClientId: string | undefined): EscritoDTO | undefined | null =>
	useLiveQuery(async () => {
		if (!idOClientId) return null;
		const esNumerico = /^\d+$/.test(idOClientId);
		const escrito = esNumerico
			? await escritosDb.porServerId(Number(idOClientId))
			: await escritosDb.porClientId(idOClientId);
		if (!escrito) return null;
		const carpetaTitulo = escrito.carpetaClientId
			? (await carpetasDb.porClientId(escrito.carpetaClientId))?.titulo
			: undefined;
		return aEscritoDTO(escrito, carpetaTitulo);
	}, [idOClientId]);

/** Tracker de hábitos para un día (activos + registro del día). */
export const useTrackerDia = (fecha: Date): TrackerHabitoView[] | undefined =>
	useLiveQuery(async () => {
		const [habitos, registros] = await Promise.all([habitosDb.todos(), registrosHabitoDb.todos()]);
		return trackerDiaDesde(habitos, registros, fecha);
	}, [fecha.getTime()]);
