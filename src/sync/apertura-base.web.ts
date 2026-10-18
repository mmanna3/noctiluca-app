import { crearCandado, GestorLocks, reintentarHasta, useCandadoBase } from "./candado-base-core";

/**
 * Web: ver `candado-base-core.ts`. Una sola pestaña es dueña de la base, y
 * antes de abrirla se espera a que OPFS la suelte.
 */

/** Directorio de OPFS donde expo-sqlite (AccessHandlePoolVFS) guarda sus archivos. */
const DIRECTORIO_OPFS = "expo-sqlite";
const MAX_ESPERA_MS = 15000;

const candado = crearCandado({
	locks: typeof navigator !== "undefined" ? (navigator.locks as unknown as GestorLocks | undefined) : undefined,
	setEstado: (estado) => useCandadoBase.getState().setEstado(estado),
	// Recargar es la única forma de cerrar el worker de expo-sqlite y soltar los
	// handles. Al volver, la pestaña encuentra el lock tomado y muestra el aviso.
	alPerder: () => window.location.reload(),
});

let iniciado = false;

export const iniciarCandadoBase = (): void => {
	if (iniciado) return;
	iniciado = true;
	void candado.iniciar();
};

export const usarBaseAca = (): void => candado.usarAca();

/**
 * Los access handles síncronos de OPFS solo existen en workers dedicados, así
 * que la prueba corre en un worker descartable: intenta abrir todos los
 * archivos del VFS y los cierra enseguida.
 */
const CODIGO_PRUEBA = `
self.onmessage = async () => {
	const abiertos = [];
	let libre = true;
	try {
		const raiz = await navigator.storage.getDirectory();
		let dir = null;
		try { dir = await raiz.getDirectoryHandle(${JSON.stringify(DIRECTORIO_OPFS)}); } catch {}
		if (dir) {
			for await (const [, h] of dir) {
				if (h.kind === "file") abiertos.push(await h.createSyncAccessHandle());
			}
		}
	} catch (e) {
		libre = !(e && e.name === "NoModificationAllowedError");
	} finally {
		for (const a of abiertos) { try { a.close(); } catch {} }
	}
	self.postMessage(libre);
};
`;

let urlPrueba: string | undefined;

const opfsLibre = (): Promise<boolean> =>
	new Promise((resolver) => {
		urlPrueba ??= URL.createObjectURL(new Blob([CODIGO_PRUEBA], { type: "text/javascript" }));
		let worker: Worker;
		try {
			worker = new Worker(urlPrueba);
		} catch {
			resolver(true); // si no se puede probar, que lo intente expo-sqlite
			return;
		}
		const terminar = (libre: boolean) => {
			worker.terminate();
			resolver(libre);
		};
		worker.onmessage = (e) => terminar(e.data === true);
		worker.onerror = () => terminar(true);
		worker.postMessage(null);
	});

/** Se llama antes de abrir la base: espera a ser la dueña y a que OPFS esté libre. */
export const prepararApertura = async (): Promise<void> => {
	iniciarCandadoBase();
	await candado.esperarSerDuena();
	const libre = await reintentarHasta(opfsLibre, { maxMs: MAX_ESPERA_MS });
	if (!libre) console.warn("La base local sigue ocupada; se intenta abrir igual.");
};

/** La apertura falló igual: el worker de expo-sqlite quedó inservible, hay que recargar. */
export const reportarFalloApertura = (error: unknown): void => {
	console.error("No se pudo abrir la base local:", error);
	useCandadoBase.getState().setEstado("error");
};
