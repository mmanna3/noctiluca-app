import { CarpetaDTO, EscritoDTO, ListaObjetivoDTO, TipoListaObjetivoEnum } from "@/api/clients";
import { carpetasDb, escritosDb, habitosDb, itemsObjetivoDb, listasObjetivoDb, registrosHabitoDb } from "./db";
import {
	aEscritoDTO,
	carpetaDesde,
	carpetaPorPropositoDesde,
	carpetasRaizDesde,
	DiaObjetivoFuturo,
	diasObjetivosFuturosDesde,
	HistoricoObjetivoResumen,
	historicoObjetivosDesde,
	listaObjetivosDesde,
	listaObjetivosPorIdDesde,
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

/** Id (servidor o clientId) de la carpeta de sistema con un propósito dado. */
export const useCarpetaPorProposito = (proposito: number): number | string | undefined =>
	useLiveQuery(async () => carpetaPorPropositoDesde(await carpetasDb.todas(), proposito), [proposito]);

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

/** Lista de objetivos por tipo (día/semana/mes) y clave de período. */
export const useListaObjetivos = (
	tipo: TipoListaObjetivoEnum | undefined,
	clavePeriodo: string | undefined,
): ListaObjetivoDTO | undefined =>
	useLiveQuery(async () => {
		if (tipo == null || !clavePeriodo) return undefined;
		const [listas, items] = await Promise.all([listasObjetivoDb.todas(), itemsObjetivoDb.todos()]);
		return listaObjetivosDesde(listas, items, tipo, clavePeriodo);
	}, [tipo, clavePeriodo]);

/** Lista de objetivos por id de servidor (vista histórica). */
export const useListaObjetivosPorId = (listaId: number | undefined): ListaObjetivoDTO | undefined | null =>
	useLiveQuery(async () => {
		if (!listaId) return null;
		const [listas, items] = await Promise.all([listasObjetivoDb.todas(), itemsObjetivoDb.todos()]);
		return listaObjetivosPorIdDesde(listas, items, listaId);
	}, [listaId]);

/** Días futuros con al menos un objetivo planificado (offline-first). */
export const useDiasObjetivosFuturos = (): DiaObjetivoFuturo[] | undefined =>
	useLiveQuery(async () => diasObjetivosFuturosDesde(await itemsObjetivoDb.todos()), []);

/** Histórico de períodos con objetivos para un tipo (día/semana/mes), offline-first. */
export const useHistoricoObjetivos = (tipo: TipoListaObjetivoEnum | undefined): HistoricoObjetivoResumen[] | undefined =>
	useLiveQuery(async () => {
		if (tipo == null) return [];
		const [listas, items] = await Promise.all([listasObjetivoDb.todas(), itemsObjetivoDb.todos()]);
		return historicoObjetivosDesde(listas, items, tipo);
	}, [tipo]);
