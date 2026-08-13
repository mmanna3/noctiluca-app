import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage } from "zustand/middleware";

interface PreferenciasHabitosState {
	ocultarSemanaActual: boolean;
	setOcultarSemanaActual: (valor: boolean) => void;
}

export const usePreferenciasHabitos = create<PreferenciasHabitosState>()(
	persist(
		(set) => ({
			ocultarSemanaActual: true,
			setOcultarSemanaActual: (valor) => set({ ocultarSemanaActual: valor }),
		}),
		{
			name: "preferencias-habitos",
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
