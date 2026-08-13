import * as Crypto from "expo-crypto";
import { create } from "zustand";
import { DURACION_SESION_PRIVADA_MS } from "@/privacidad/privacidad-core";

export const hashVerificadorOffline = async (
	password: string,
	userId: string,
): Promise<string> => {
	return Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
		`${password}:${userId}`,
	);
};

interface SesionPrivadaState {
	desbloqueadoHasta: number;
	verificadorOffline: string | null;
	sesionActiva: () => boolean;
	renovarSesion: () => void;
	registrarVerificador: (hash: string) => void;
	validarOffline: (password: string, userId: string) => Promise<boolean>;
	limpiarSesion: () => void;
}

/** Estado en memoria: la sesión privada vence al cerrar la app (como sessionStorage). */
export const useSesionPrivada = create<SesionPrivadaState>()((set, get) => ({
	desbloqueadoHasta: 0,
	verificadorOffline: null,
	sesionActiva: () => Date.now() < get().desbloqueadoHasta,
	renovarSesion: () =>
		set({ desbloqueadoHasta: Date.now() + DURACION_SESION_PRIVADA_MS }),
	registrarVerificador: (hash) => set({ verificadorOffline: hash }),
	validarOffline: async (password, userId) => {
		const { verificadorOffline } = get();
		if (!verificadorOffline) return false;
		const hash = await hashVerificadorOffline(password, userId);
		return hash === verificadorOffline;
	},
	limpiarSesion: () => set({ desbloqueadoHasta: 0, verificadorOffline: null }),
}));

export const registrarSesionTrasPassword = async (
	password: string,
	userId: string,
): Promise<void> => {
	const hash = await hashVerificadorOffline(password, userId);
	useSesionPrivada.getState().registrarVerificador(hash);
	useSesionPrivada.getState().renovarSesion();
};
