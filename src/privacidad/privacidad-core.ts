import type { EscritoDTO } from "@/api/clients";
import { CarpetaLocal, EscritoLocal } from "@/sync/tipos";

export type MotivoSesionPrivada =
	| "carpeta_privada"
	| "modo_lectura"
	| "papelera"
	| "config_privacidad";

export const DURACION_SESION_PRIVADA_MS = 5 * 60 * 1000;

const esRaiz = (c: CarpetaLocal): boolean =>
	c.carpetaPadreId === undefined || c.carpetaPadreId === null;

export const carpetaPorServerId = (
	carpetas: CarpetaLocal[],
	serverId: number | string | undefined,
): CarpetaLocal | null => {
	if (serverId === undefined || serverId === null || serverId === "") return null;
	const id = Number(serverId);
	if (!id) return null;
	return carpetas.find((c) => c.serverId === id) ?? null;
};

/** Sube la jerarquía hasta la carpeta raíz. */
export const carpetaRaizDe = (
	carpetaId: number | string | undefined,
	carpetas: CarpetaLocal[],
): CarpetaLocal | null => {
	const carpeta = carpetaPorServerId(carpetas, carpetaId);
	if (!carpeta) return null;
	if (esRaiz(carpeta)) return carpeta;

	const padre = carpetaPorServerId(carpetas, carpeta.carpetaPadreId);
	if (!padre) return carpeta;
	return esRaiz(padre) ? padre : null;
};

export const esCarpetaPrivada = (
	carpetaId: number | string | undefined,
	carpetas: CarpetaLocal[],
): boolean => {
	const raiz = carpetaRaizDe(carpetaId, carpetas);
	return raiz?.requiereAutenticacion === true;
};

export const escritoEsPrivado = (
	escrito: EscritoLocal | EscritoDTO,
	carpetas: CarpetaLocal[],
): boolean => {
	const carpetaId =
		"carpetaId" in escrito && escrito.carpetaId !== undefined
			? escrito.carpetaId
			: undefined;
	if (carpetaId !== undefined) return esCarpetaPrivada(carpetaId, carpetas);

	const clientId =
		"carpetaClientId" in escrito ? escrito.carpetaClientId : undefined;
	if (!clientId) return false;
	const carpeta = carpetas.find((c) => c.clientId === clientId);
	if (!carpeta?.serverId) return false;
	return esCarpetaPrivada(carpeta.serverId, carpetas);
};

export const evaluarDestinoPrivado = (
	pathname: string,
	params: Record<string, string | undefined>,
	carpetas: CarpetaLocal[],
): MotivoSesionPrivada | null => {
	const ruta = pathname.replace(/\/+$/, "") || "/";

	if (ruta === "/modo-lectura") return "modo_lectura";
	if (ruta === "/carpetas-privadas") return "config_privacidad";
	if (ruta === "/papelera" || ruta.startsWith("/papelera/")) return "papelera";

	const carpetaId = params.carpetaId;
	if (carpetaId && esCarpetaPrivada(carpetaId, carpetas)) return "carpeta_privada";

	return null;
};

export const filtrarEscritosPublicos = <T extends EscritoLocal | EscritoDTO>(
	escritos: T[],
	carpetas: CarpetaLocal[],
): T[] => escritos.filter((e) => !escritoEsPrivado(e, carpetas));

export const etiquetaMotivoSesionPrivada = (motivo: MotivoSesionPrivada): string => {
	switch (motivo) {
	case "carpeta_privada":
		return "Esta carpeta es privada";
	case "modo_lectura":
		return "Modo lectura";
	case "papelera":
		return "Papelera";
	case "config_privacidad":
		return "Carpetas privadas";
	}
};
