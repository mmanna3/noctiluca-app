import {
	CarpetaDTO,
	EscritoDTO,
	HabitoTrackerItemDTO,
	ItemObjetivoDTO,
	ListaObjetivoDTO,
	TipoHabitoEnum,
	TipoListaObjetivoEnum,
} from "@/api/clients";
import { fechaClave, parsearFechaClave } from "./fechas";
import {
	CarpetaLocal,
	EscritoLocal,
	HabitoLocal,
	ItemObjetivoLocal,
	ListaObjetivoLocal,
	RegistroHabitoLocal,
} from "./tipos";

const escritosDeCarpeta = (escritos: EscritoLocal[], carpeta: CarpetaLocal): EscritoLocal[] =>
	escritos.filter(
		(e) =>
			!e.estaEnPapelera &&
			(e.carpetaClientId === carpeta.clientId ||
				(e.carpetaId !== undefined && e.carpetaId === carpeta.serverId)),
	);

const subcarpetasDe = (carpetas: CarpetaLocal[], carpeta: CarpetaLocal): CarpetaLocal[] =>
	carpetas.filter((c) => carpeta.serverId !== undefined && c.carpetaPadreId === carpeta.serverId);

const tiempo = (valor?: string): number => (valor ? new Date(valor).getTime() : 0);

export const ordenarEscritos = (escritos: EscritoLocal[], criterio?: number): EscritoLocal[] => {
	const copia = [...escritos];
	switch (criterio) {
	case 2:
		return copia.sort((a, b) => tiempo(b.fechaHoraEdicion) - tiempo(a.fechaHoraEdicion));
	case 3:
		return copia.sort((a, b) => a.titulo.localeCompare(b.titulo));
	case 4:
		return copia.sort((a, b) => tiempo(a.fechaHoraCreacion) - tiempo(b.fechaHoraCreacion));
	case 5:
		return copia.sort((a, b) => tiempo(a.fechaHoraEdicion) - tiempo(b.fechaHoraEdicion));
	case 6:
		return copia.sort((a, b) => b.titulo.localeCompare(a.titulo));
	case 1:
	default:
		return copia.sort((a, b) => tiempo(b.fechaHoraCreacion) - tiempo(a.fechaHoraCreacion));
	}
};

export const aEscritoDTO = (e: EscritoLocal, carpetaTitulo?: string): EscritoDTO =>
	new EscritoDTO({
		id: e.serverId,
		clientId: e.clientId,
		titulo: e.titulo,
		cuerpo: e.cuerpo,
		carpetaId: e.carpetaId ?? 0,
		carpetaClientId: e.carpetaClientId,
		carpetaTitulo,
		estaEnPapelera: e.estaEnPapelera,
		fechaHoraCreacion: e.fechaHoraCreacion ? new Date(e.fechaHoraCreacion) : undefined,
		fechaHoraEdicion: e.fechaHoraEdicion ? new Date(e.fechaHoraEdicion) : undefined,
		version: e.version,
	});

export const aCarpetaDTO = (
	c: CarpetaLocal,
	todasLasCarpetas: CarpetaLocal[],
	todosLosEscritos: EscritoLocal[],
	incluirHijos: boolean,
): CarpetaDTO => {
	const escritos = escritosDeCarpeta(todosLosEscritos, c);
	const subcarpetas = subcarpetasDe(todasLasCarpetas, c);

	return new CarpetaDTO({
		id: c.serverId,
		clientId: c.clientId,
		titulo: c.titulo,
		posicion: c.posicion ?? 0,
		criterioDeOrden: c.criterioDeOrden ?? 1,
		carpetaPadreId: c.carpetaPadreId,
		esSistema: c.esSistema ?? false,
		requiereAutenticacion: c.requiereAutenticacion ?? false,
		propositoCarpeta: c.propositoCarpeta ?? undefined,
		version: c.version,
		cantidadDeEscritos: escritos.length,
		cantidadDeSubCarpetas: subcarpetas.length,
		escritos: incluirHijos
			? ordenarEscritos(escritos, c.criterioDeOrden).map((e) => aEscritoDTO(e))
			: undefined,
		subCarpetas: incluirHijos
			? subcarpetas.map((sc) => aCarpetaDTO(sc, todasLasCarpetas, todosLosEscritos, false))
			: undefined,
	});
};

export const carpetasRaizDesde = (
	carpetas: CarpetaLocal[],
	escritos: EscritoLocal[],
): CarpetaDTO[] =>
	carpetas
		.filter((c) => c.carpetaPadreId === undefined || c.carpetaPadreId === null)
		.sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0))
		.map((c) => aCarpetaDTO(c, carpetas, escritos, false));

/** Busca por id de servidor, o por clientId (GUID) si aún no fue sincronizada. */
export const carpetaDesde = (
	idOClientId: number | string | undefined,
	carpetas: CarpetaLocal[],
	escritos: EscritoLocal[],
): CarpetaDTO | null => {
	if (idOClientId === undefined || idOClientId === null || idOClientId === "") return null;
	const id = Number(idOClientId);
	const carpeta = id
		? carpetas.find((c) => c.serverId === id)
		: carpetas.find((c) => c.clientId === idOClientId);
	if (!carpeta) return null;
	return aCarpetaDTO(carpeta, carpetas, escritos, true);
};

const tituloDeCarpetaDe = (e: EscritoLocal, carpetas: CarpetaLocal[]): string | undefined =>
	carpetas.find(
		(c) =>
			(e.carpetaClientId !== undefined && c.clientId === e.carpetaClientId) ||
			(e.carpetaId !== undefined && c.serverId === e.carpetaId),
	)?.titulo;

const porCreacionDesc = (a: EscritoLocal, b: EscritoLocal): number =>
	(b.fechaHoraCreacion ? new Date(b.fechaHoraCreacion).getTime() : 0) -
	(a.fechaHoraCreacion ? new Date(a.fechaHoraCreacion).getTime() : 0);

/** Escritos en papelera, más recientes primero, con el título de su carpeta. */
export const papeleraDesde = (carpetas: CarpetaLocal[], escritos: EscritoLocal[]): EscritoDTO[] =>
	escritos
		.filter((e) => e.estaEnPapelera)
		.sort(porCreacionDesc)
		.map((e) => aEscritoDTO(e, tituloDeCarpetaDe(e, carpetas)));

/** Todos los escritos vigentes (no papelera), con el título de su carpeta. */
export const todosLosEscritosDesde = (
	carpetas: CarpetaLocal[],
	escritos: EscritoLocal[],
): EscritoDTO[] =>
	escritos
		.filter((e) => !e.estaEnPapelera)
		.sort(porCreacionDesc)
		.map((e) => aEscritoDTO(e, tituloDeCarpetaDe(e, carpetas)));

/** Vista del tracker con identificadores offline para guardar registros. */
export type TrackerHabitoView = HabitoTrackerItemDTO & {
	clientId: string;
	registroClientId?: string;
};

export const trackerDiaDesde = (
	habitos: HabitoLocal[],
	registros: RegistroHabitoLocal[],
	fecha: Date,
): TrackerHabitoView[] => {
	const clave = fechaClave(fecha);
	return habitos
		.filter((h) => h.activo !== false)
		.sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0))
		.map((h) => {
			const reg = registros.find((r) => r.habitoClientId === h.clientId && r.fecha === clave);
			return Object.assign(new HabitoTrackerItemDTO(), {
				id: h.serverId,
				nombre: h.nombre,
				tipo: h.tipo as TipoHabitoEnum,
				metaMinutos: h.metaMinutos,
				registroId: reg?.serverId,
				valorBooleano: reg?.valorBooleano,
				valorNumerico: reg?.valorNumerico,
				clientId: h.clientId,
				registroClientId: reg?.clientId,
			}) as TrackerHabitoView;
		});
};

export const aItemObjetivoDTO = (i: ItemObjetivoLocal): ItemObjetivoDTO =>
	new ItemObjetivoDTO({
		id: i.serverId,
		clientId: i.clientId,
		texto: i.texto,
		completado: i.completado,
		posicion: i.posicion,
		fechaCompletado: i.fechaCompletado ? new Date(i.fechaCompletado) : undefined,
		listaTipo: i.listaTipo as TipoListaObjetivoEnum,
		listaClavePeriodo: i.listaClavePeriodo,
		version: i.version,
	});

export const listaObjetivosDesde = (
	listas: ListaObjetivoLocal[],
	items: ItemObjetivoLocal[],
	tipo: number,
	clavePeriodo: string,
): ListaObjetivoDTO => {
	const lista = listas.find((l) => l.tipo === tipo && l.clavePeriodo === clavePeriodo);
	const itemsLista = items
		.filter((i) => i.listaTipo === tipo && i.listaClavePeriodo === clavePeriodo)
		.sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0))
		.map(aItemObjetivoDTO);

	return new ListaObjetivoDTO({
		id: lista?.serverId,
		clientId: lista?.clientId,
		tipo: tipo as TipoListaObjetivoEnum,
		clavePeriodo,
		fechaInicio: lista?.fechaInicio ? new Date(lista.fechaInicio) : undefined,
		fechaFin: lista?.fechaFin ? new Date(lista.fechaFin) : undefined,
		fechaCreacion: lista?.fechaCreacion ? new Date(lista.fechaCreacion) : undefined,
		items: itemsLista,
		version: lista?.version,
	});
};

export const listaObjetivosPorIdDesde = (
	listas: ListaObjetivoLocal[],
	items: ItemObjetivoLocal[],
	listaId: number,
): ListaObjetivoDTO | null => {
	const lista = listas.find((l) => l.serverId === listaId);
	if (!lista) return null;
	return listaObjetivosDesde(listas, items, lista.tipo, lista.clavePeriodo);
};

/** Clave estable para ítems (server id o clientId). */
export const claveDeItem = (item: ItemObjetivoDTO): string =>
	item.clientId ?? String(item.id ?? "");

export interface DiaObjetivoFuturo {
	clavePeriodo: string;
	fecha: Date;
	cantidad: number;
}

const inicioDeDia = (fecha: Date): Date =>
	new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

/** Días futuros con al menos un objetivo con texto (agrupado por clavePeriodo). */
export const diasObjetivosFuturosDesde = (
	items: ItemObjetivoLocal[],
	referencia = new Date(),
): DiaObjetivoFuturo[] => {
	const hoy = inicioDeDia(referencia);
	const minFuturo = hoy.getTime() + 86400000;

	const porClave = new Map<string, number>();
	for (const item of items) {
		if (item.listaTipo !== TipoListaObjetivoEnum._1) continue;
		if (!(item.texto ?? "").trim()) continue;
		const fecha = parsearFechaClave(item.listaClavePeriodo);
		if (fecha.getTime() < minFuturo) continue;
		porClave.set(
			item.listaClavePeriodo,
			(porClave.get(item.listaClavePeriodo) ?? 0) + 1,
		);
	}

	return [...porClave.entries()]
		.map(([clavePeriodo, cantidad]) => ({
			clavePeriodo,
			fecha: parsearFechaClave(clavePeriodo),
			cantidad,
		}))
		.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
};
