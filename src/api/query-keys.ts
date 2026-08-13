import { QueryKey } from "@tanstack/react-query";

export const queryKeys = {
	carpetas: ["carpetas"] as const,
	carpetasParaMover: ["carpetas-para-mover"] as const,
	carpeta: (id: number | string | null | undefined) => ["carpeta", Number(id)] as const,
	todasLasCarpetas: ["carpeta"] as const,
	escritos: ["escritos"] as const,
	escrito: (id: number | string | null | undefined) => ["escrito", Number(id)] as const,
	todosLosEscritos: ["escrito"] as const,
	papelera: ["papelera"] as const,
	habitos: ["habitos"] as const,
	habitosTracker: ["habitos-tracker"] as const,
	habitosResumenSemanal: ["habitos-resumen-semanal"] as const,
	objetivosDia: ["objetivos-dia"] as const,
	objetivosLista: (id: number | string | null | undefined) => ["objetivos-lista", Number(id)] as const,
	objetivosHistorico: (tipo: number) => ["objetivos-historico", tipo] as const,
	buscarEscritos: (texto: string) => ["buscar-escritos", texto] as const,
};

export const clavesObjetivos: QueryKey[] = [
	queryKeys.objetivosDia,
	["objetivos-lista"],
	["objetivos-historico"],
];

export const clavesCarpetas: QueryKey[] = [
	queryKeys.carpetas,
	queryKeys.todasLasCarpetas,
	queryKeys.carpetasParaMover,
];

export const clavesEscritos: QueryKey[] = [
	queryKeys.todosLosEscritos,
	queryKeys.escritos,
	queryKeys.papelera,
	queryKeys.todasLasCarpetas,
];

export const clavesHabitos: QueryKey[] = [
	queryKeys.habitos,
	queryKeys.habitosTracker,
	queryKeys.habitosResumenSemanal,
];
