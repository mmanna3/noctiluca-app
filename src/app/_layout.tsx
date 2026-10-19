import "../global.css";

import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { iniciarSync } from "@/sync/sync-engine";
import { useAuth } from "@/hooks/use-auth";
import { GuardBaseLocal } from "@/components/guard-base-local";
import { useFonts } from "expo-font";
import {
	InstrumentSans_400Regular,
	InstrumentSans_500Medium,
	InstrumentSans_600SemiBold,
	InstrumentSans_700Bold,
} from "@expo-google-fonts/instrument-sans";
import {
	SourceSerif4_400Regular,
	SourceSerif4_500Medium,
	SourceSerif4_600SemiBold,
	SourceSerif4_700Bold,
} from "@expo-google-fonts/source-serif-4";
import Toast, { ErrorToast, SuccessToast, ToastConfig } from "react-native-toast-message";
import { estiloFuente } from "@/components/ui/texto";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			staleTime: 30_000,
		},
	},
});

/** Las fuentes que usa la app (ver `FAMILIAS` en texto.tsx). */
const FUENTES = {
	InstrumentSans_400Regular,
	InstrumentSans_500Medium,
	InstrumentSans_600SemiBold,
	InstrumentSans_700Bold,
	SourceSerif4_400Regular,
	SourceSerif4_500Medium,
	SourceSerif4_600SemiBold,
	SourceSerif4_700Bold,
};

/**
 * Los toasts dibujan su propio texto: se les pasa la fuente de la app. El título
 * trae `fontWeight: "bold"` de la librería y no se puede sacar, así que se usa la
 * cara Bold: en iOS, "bold" busca la cara más cercana a 700, que es ella misma;
 * en web se pisa con normal para que el navegador no la engrose de nuevo.
 */
const tituloToast = { ...estiloFuente(700), fontWeight: Platform.OS === "web" ? "normal" : "bold" } as const;
const configToast: ToastConfig = {
	success: (props) => <SuccessToast {...props} text1Style={tituloToast} text2Style={estiloFuente(400)} />,
	error: (props) => <ErrorToast {...props} text1Style={tituloToast} text2Style={estiloFuente(400)} />,
};

function AuthHydrator() {
	useEffect(() => {
		void useAuth.getState().hydrate();
	}, []);

	return null;
}

function SyncInitializer() {
	const hydrated = useAuth((s) => s.hydrated);

	useEffect(() => {
		if (hydrated) iniciarSync();
	}, [hydrated]);

	return null;
}

export default function RootLayout() {
	const [fontsLoaded] = useFonts(FUENTES);

	useEffect(() => {
		if (fontsLoaded) void SplashScreen.hideAsync();
	}, [fontsLoaded]);

	if (!fontsLoaded) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<QueryClientProvider client={queryClient}>
					<AuthHydrator />
					<SyncInitializer />
					<GuardBaseLocal>
						<Stack screenOptions={{ headerShown: false, gestureEnabled: true }} />
					</GuardBaseLocal>
					<Toast config={configToast} />
				</QueryClientProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
