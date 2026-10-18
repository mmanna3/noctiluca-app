import { Platform } from "react-native";
import { create } from "zustand";

/**
 * Coordinación de la base local entre pestañas (solo web).
 *
 * En web, expo-sqlite guarda la base en OPFS con access handles exclusivos:
 * si dos documentos la abren a la vez, el segundo falla con
 * `NoModificationAllowedError`, y el worker de expo-sqlite queda trabado (no
 * sirve reintentar en la misma página). Por eso:
 *
 * - Una sola pestaña es "dueña" de la base: la que tiene el Web Lock
 *   `noctiluca-db`. Las demás muestran un aviso y quedan en la cola del lock,
 *   así que se activan solas cuando la dueña se cierra. "Usar acá" le roba el
 *   lock a la dueña, que se recarga para soltar la base.
 * - Antes de abrir, la dueña espera a que los archivos de OPFS estén libres
 *   (el documento anterior puede tenerlos abiertos un rato después de una
 *   recarga o de pasar del login a la app).
 *
 * Este archivo tiene la lógica pura (testeable); lo que toca APIs del
 * navegador está en `apertura-base.web.ts`.
 */
export type EstadoCandado = "verificando" | "duena" | "otra-pestana" | "cedida" | "error";

interface CandadoState {
	estado: EstadoCandado;
	setEstado: (estado: EstadoCandado) => void;
}

export const useCandadoBase = create<CandadoState>((set) => ({
	estado: Platform.OS === "web" ? "verificando" : "duena",
	setEstado: (estado) => set({ estado }),
}));

export const NOMBRE_LOCK = "noctiluca-db";

/** Lo mínimo de `navigator.locks` que se usa (permite testear con un falso). */
export interface GestorLocks {
	request(
		nombre: string,
		opciones: { ifAvailable?: boolean; steal?: boolean; signal?: AbortSignal },
		callback: (lock: unknown) => Promise<unknown> | unknown,
	): Promise<unknown>;
}

export interface Candado {
	/** Intenta ser la dueña; si otra pestaña lo es, avisa y queda en la cola. */
	iniciar: () => Promise<void>;
	/** Le saca la base a la pestaña dueña. */
	usarAca: () => void;
	/** Se resuelve cuando esta pestaña es la dueña. */
	esperarSerDuena: () => Promise<void>;
}

export const crearCandado = (deps: {
	locks: GestorLocks | undefined;
	setEstado: (estado: EstadoCandado) => void;
	/** Esta pestaña era la dueña y otra le robó el lock: tiene que soltar la base. */
	alPerder: () => void;
}): Candado => {
	let resolverDuena!: () => void;
	const duena = new Promise<void>((r) => (resolverDuena = r));
	/** Qué solicitud del lock tiene la base (cada request se numera). */
	let solicitudDuena: number | undefined;
	let ultimaSolicitud = 0;
	let cola: AbortController | undefined;

	/** Pide el lock; si lo obtiene, lo retiene para siempre (hasta cerrar la pestaña o que lo roben). */
	const pedir = (opciones: { ifAvailable?: boolean; steal?: boolean; signal?: AbortSignal }, alNoObtener?: () => void) => {
		const id = ++ultimaSolicitud;
		deps.locks!
			.request(NOMBRE_LOCK, opciones, (lock) => {
				if (!lock) {
					alNoObtener?.();
					return;
				}
				solicitudDuena = id;
				if (cola && !opciones.signal) cola.abort();
				deps.setEstado("duena");
				resolverDuena();
				return new Promise<never>(() => {});
			})
			// Solo importa el rechazo de la solicitud que tenía la base: se la robaron.
			// Cualquier otro (p. ej. la espera en la cola cancelada) se ignora.
			.catch(() => {
				if (solicitudDuena !== id) return;
				solicitudDuena = undefined;
				deps.setEstado("cedida");
				deps.alPerder();
			});
	};

	const iniciar = async (): Promise<void> => {
		if (!deps.locks) {
			// Navegador sin Web Locks: se asume una sola pestaña, como antes.
			deps.setEstado("duena");
			resolverDuena();
			return;
		}
		const disponible = await new Promise<boolean>((resolver) => {
			pedir({ ifAvailable: true }, () => resolver(false));
			void duena.then(() => resolver(true));
		});
		if (disponible) return;

		deps.setEstado("otra-pestana");
		cola = new AbortController();
		pedir({ signal: cola.signal });
	};

	const usarAca = (): void => {
		if (solicitudDuena !== undefined || !deps.locks) return;
		deps.setEstado("verificando");
		pedir({ steal: true });
	};

	return { iniciar, usarAca, esperarSerDuena: () => duena };
};

/**
 * Reintenta `probar` con espera creciente hasta que dé `true` o se pase de
 * `maxMs`. Devuelve si lo logró.
 */
export const reintentarHasta = async (
	probar: () => Promise<boolean>,
	opciones: { maxMs: number; dormir?: (ms: number) => Promise<void>; ahora?: () => number },
): Promise<boolean> => {
	const dormir = opciones.dormir ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
	const ahora = opciones.ahora ?? Date.now;
	const inicio = ahora();
	for (let intento = 0; ; intento++) {
		if (await probar()) return true;
		if (ahora() - inicio >= opciones.maxMs) return false;
		await dormir(Math.min(50 * 2 ** intento, 1000));
	}
};
