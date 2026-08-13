import { jwtDecode } from "jwt-decode";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Almacenamiento persistente: SecureStore en iOS, localStorage en web. */
const crearStorage = () => {
	if (Platform.OS === "web") {
		// typeof window check: localStorage no existe en SSR (Expo static output)
		if (typeof window === "undefined") return undefined;
		return createJSONStorage(() => localStorage);
	}
	// expo-secure-store: importación diferida para no romper en web
	const SecureStore = require("expo-secure-store");
	return createJSONStorage(() => ({
		getItem: (key: string) => SecureStore.getItemAsync(key),
		setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
		removeItem: (key: string) => SecureStore.deleteItemAsync(key),
	}));
};

interface AuthState {
	token: string | null;
	isAuthenticated: boolean;
	userRole: string | null;
	userName: string | null;
	/** false hasta que el store se rehidrate desde almacenamiento persistente */
	hydrated: boolean;
	login: (usuario: string, password: string) => Promise<boolean>;
	logout: () => void;
	esAdmin: () => boolean;
	setHydrated: (v: boolean) => void;
}

interface DecodedToken {
	role: string;
	name?: string;
	[key: string]: string | number | boolean | undefined;
}

export const useAuth = create<AuthState>()(
	persist(
		(set, get) => ({
			token: null,
			isAuthenticated: false,
			userRole: null,
			userName: null,
			hydrated: false,
			login: async (usuario: string, password: string) => {
				try {
					const [{ api }, { LoginDTO }] = await Promise.all([
						import("../api/api"),
						import("../api/clients"),
					]);
					const loginRequest = new LoginDTO({ usuario, password });
					const response = await api.login(loginRequest);

					if (response.exito && response.token) {
						const decodedToken = jwtDecode<DecodedToken>(response.token);
						set({
							token: response.token,
							isAuthenticated: true,
							userRole: decodedToken.role,
							userName: decodedToken.name || usuario,
						});
						return true;
					}

					return false;
				} catch (error) {
					console.error("Error en login:", error);
					return false;
				}
			},
			logout: () => {
				const { useSesionPrivada } = require("./use-sesion-privada");
				useSesionPrivada.getState().limpiarSesion();
				set({ token: null, isAuthenticated: false, userRole: null, userName: null });
			},
			esAdmin: () => {
				const { userRole } = get();
				return userRole === "Administrador";
			},
			setHydrated: (v: boolean) => set({ hydrated: v }),
		}),
		{
			name: "auth-storage",
			storage: crearStorage(),
			// skipHydration evita hidratación sincrónica que genera mismatch en React 19
			// con Expo Router output:static (SSR). Se rehidrata explícitamente en useEffect.
			skipHydration: true,
			partialize: (state) => ({
				token: state.token,
				isAuthenticated: state.isAuthenticated,
				userRole: state.userRole,
				userName: state.userName,
			}),
			onRehydrateStorage: () => (state) => {
				state?.setHydrated(true);
			},
		},
	),
);
