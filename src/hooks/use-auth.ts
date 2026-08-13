import { jwtDecode } from "jwt-decode";
import { Platform } from "react-native";
import { create } from "zustand";

const STORAGE_KEY = "auth-token";

const guardarToken = async (token: string) => {
	if (Platform.OS === "web") {
		if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, token);
	} else {
		const SecureStore = require("expo-secure-store");
		await SecureStore.setItemAsync(STORAGE_KEY, token);
	}
};

const leerToken = async (): Promise<string | null> => {
	if (Platform.OS === "web") {
		if (typeof window === "undefined") return null;
		return localStorage.getItem(STORAGE_KEY);
	}
	const SecureStore = require("expo-secure-store");
	return SecureStore.getItemAsync(STORAGE_KEY);
};

const eliminarToken = async () => {
	if (Platform.OS === "web") {
		if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
	} else {
		const SecureStore = require("expo-secure-store");
		await SecureStore.deleteItemAsync(STORAGE_KEY);
	}
};

interface DecodedToken {
	role: string;
	name?: string;
	[key: string]: string | number | boolean | undefined;
}

interface AuthState {
	token: string | null;
	isAuthenticated: boolean;
	userRole: string | null;
	userName: string | null;
	/** false hasta que se lee el token guardado en storage al arrancar */
	hydrated: boolean;
	login: (usuario: string, password: string) => Promise<boolean>;
	logout: () => void;
	esAdmin: () => boolean;
	hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
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
			const response = await api.login(new LoginDTO({ usuario, password }));
			if (response.exito && response.token) {
				const decoded = jwtDecode<DecodedToken>(response.token);
				await guardarToken(response.token);
				set({
					token: response.token,
					isAuthenticated: true,
					userRole: decoded.role,
					userName: decoded.name || usuario,
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
		void eliminarToken();
		const { useSesionPrivada } = require("./use-sesion-privada");
		useSesionPrivada.getState().limpiarSesion();
		set({ token: null, isAuthenticated: false, userRole: null, userName: null });
	},

	esAdmin: () => get().userRole === "Administrador",

	hydrate: async () => {
		try {
			const token = await leerToken();
			if (token) {
				const decoded = jwtDecode<DecodedToken>(token);
				set({
					token,
					isAuthenticated: true,
					userRole: decoded.role,
					userName: decoded.name ?? null,
					hydrated: true,
				});
			} else {
				set({ hydrated: true });
			}
		} catch {
			set({ hydrated: true });
		}
	},
}));
