import { create } from "zustand";
import { EstadoGuardado } from "./tipos";

interface EstadoSyncState {
	estado: EstadoGuardado;
	pendientes: number;
	online: boolean;
	sincronizando: boolean;
	syncInicialCompleto: boolean;
	ultimoError?: string;
	setEstado: (estado: EstadoGuardado) => void;
	setPendientes: (pendientes: number) => void;
	setOnline: (online: boolean) => void;
	setSincronizando: (sincronizando: boolean) => void;
	setSyncInicialCompleto: (completo: boolean) => void;
	setError: (mensaje?: string) => void;
}

export const useEstadoSync = create<EstadoSyncState>((set) => ({
	estado: "guardando",
	pendientes: 0,
	online: true,
	sincronizando: false,
	syncInicialCompleto: false,
	setEstado: (estado) => set({ estado }),
	setPendientes: (pendientes) => set({ pendientes }),
	setOnline: (online) => set({ online }),
	setSincronizando: (sincronizando) => set({ sincronizando }),
	setSyncInicialCompleto: (syncInicialCompleto) => set({ syncInicialCompleto }),
	setError: (ultimoError) => set({ ultimoError, estado: ultimoError ? "error" : "guardado" }),
}));

export const recalcularEstado = (pendientes: number, online: boolean): EstadoGuardado => {
	if (pendientes === 0) return "guardado";
	if (!online) return "sin-conexion";
	return "guardando";
};
