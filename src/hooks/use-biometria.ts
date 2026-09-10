import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CLAVE_CREDENTIAL = "biometria-credential";

/**
 * En web no hay `expo-secure-store` nativo (su shim es un objeto vacío y sus
 * métodos tiran excepción) ni biometría, así que todas estas funciones son
 * no-ops que devuelven "no disponible". El flujo de contraseña sigue andando.
 */
const esWeb = Platform.OS === "web";

export const biometriaDisponible = async (): Promise<boolean> => {
	if (esWeb) return false;
	const compatible = await LocalAuthentication.hasHardwareAsync();
	if (!compatible) return false;
	const enrolled = await LocalAuthentication.isEnrolledAsync();
	return enrolled;
};

export const autenticarConBiometria = async (motivo: string): Promise<boolean> => {
	if (esWeb) return false;
	const resultado = await LocalAuthentication.authenticateAsync({
		promptMessage: motivo,
		fallbackLabel: "Usar contraseña",
		cancelLabel: "Cancelar",
		disableDeviceFallback: false,
	});
	return resultado.success;
};

export const guardarCredencialParaBiometria = async (password: string): Promise<void> => {
	if (esWeb) return;
	await SecureStore.setItemAsync(CLAVE_CREDENTIAL, password, {
		requireAuthentication: false,
	});
};

export const hayCredencialGuardada = async (): Promise<boolean> => {
	if (esWeb) return false;
	try {
		const valor = await SecureStore.getItemAsync(CLAVE_CREDENTIAL, {
			requireAuthentication: false,
		});
		return valor !== null;
	} catch {
		return false;
	}
};

export const leerCredencialConBiometria = async (): Promise<string | null> => {
	if (esWeb) return null;
	try {
		return await SecureStore.getItemAsync(CLAVE_CREDENTIAL, {
			requireAuthentication: false,
		});
	} catch {
		return null;
	}
};

export const eliminarCredencialBiometrica = async (): Promise<void> => {
	if (esWeb) return;
	await SecureStore.deleteItemAsync(CLAVE_CREDENTIAL);
};
