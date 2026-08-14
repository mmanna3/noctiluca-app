import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const CLAVE_CREDENTIAL = "biometria-credential";

export const biometriaDisponible = async (): Promise<boolean> => {
	const compatible = await LocalAuthentication.hasHardwareAsync();
	if (!compatible) return false;
	const enrolled = await LocalAuthentication.isEnrolledAsync();
	return enrolled;
};

export const autenticarConBiometria = async (motivo: string): Promise<boolean> => {
	const resultado = await LocalAuthentication.authenticateAsync({
		promptMessage: motivo,
		fallbackLabel: "Usar contraseña",
		cancelLabel: "Cancelar",
		disableDeviceFallback: false,
	});
	return resultado.success;
};

export const guardarCredencialParaBiometria = async (password: string): Promise<void> => {
	await SecureStore.setItemAsync(CLAVE_CREDENTIAL, password, {
		requireAuthentication: false,
	});
};

export const hayCredencialGuardada = async (): Promise<boolean> => {
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
	try {
		return await SecureStore.getItemAsync(CLAVE_CREDENTIAL, {
			requireAuthentication: false,
		});
	} catch {
		return null;
	}
};

export const eliminarCredencialBiometrica = async (): Promise<void> => {
	await SecureStore.deleteItemAsync(CLAVE_CREDENTIAL);
};
