import { sincronizarPronto } from "./sync-engine";

/** Dispara una sincronización manual (ej. botón del indicador de sync). */
export const pedirSync = (): void => {
	sincronizarPronto();
};
