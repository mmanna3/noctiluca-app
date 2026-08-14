import { create } from "zustand";
import { EstadoGuardado } from "./tipos";

interface EstadoSyncState {
	estado: EstadoGuardado;
	pendientes: number;
	online: boolean;
	sincronizando: boolean;
	syncInicialCompleto: boolean;
	solicitudesActivas: number;
	ultimoError?: string;
	setEstado: (estado: EstadoGuardado) => void;
	setPendientes: (pendientes: number) => void;
	setOnline: (online: boolean) => void;
	setSincronizando: (sincronizando: boolean) => void;
	setSyncInicialCompleto: (completo: boolean) => void;
	setError: (mensaje?: string) => void;
	incrementarSolicitudes: () => void;
	decrementarSolicitudes: () => void;
}

export const useEstadoSync = create<EstadoSyncState>((set) => ({
	estado: "guardado",
	pendientes: 0,
	online: true,
	sincronizando: false,
	syncInicialCompleto: true,
	solicitudesActivas: 0,
	setEstado: (estado) => set({ estado }),
	setPendientes: (pendientes) => set({ pendientes }),
	setOnline: (online) => set({ online }),
	setSincronizando: (sincronizando) => set({ sincronizando }),
	setSyncInicialCompleto: (syncInicialCompleto) => set({ syncInicialCompleto }),
	setError: (ultimoError) => set({ ultimoError, estado: ultimoError ? "error" : "guardado" }),
	incrementarSolicitudes: () => set((s) => ({ solicitudesActivas: s.solicitudesActivas + 1 })),
	decrementarSolicitudes: () => set((s) => ({ solicitudesActivas: Math.max(0, s.solicitudesActivas - 1) })),
}));

export const recalcularEstado = (pendientes: number, online: boolean): EstadoGuardado => {
	if (pendientes === 0) return "guardado";
	if (!online) return "sin-conexion";
	return "guardando";
};
