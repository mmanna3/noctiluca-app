import "../global.css";

import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEstadoSync } from "@/sync/estado-sync";
import { useAuth } from "@/hooks/use-auth";
import { useFonts, Merriweather_400Regular, Merriweather_700Bold } from "@expo-google-fonts/merriweather";

SplashScreen.preventAutoHideAsync();

// Aplica Merriweather globalmente a todos los Text y TextInput
(Text as any).defaultProps = { style: { fontFamily: "Merriweather_400Regular", fontSize: 16 } };
(TextInput as any).defaultProps = { style: { fontFamily: "Merriweather_400Regular", fontSize: 16 } };

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			staleTime: 30_000,
		},
	},
});

function NetInfoMonitor() {
	const setOnline = useEstadoSync((s) => s.setOnline);

	useEffect(() => {
		const unsub = NetInfo.addEventListener((state) => {
			setOnline(state.isConnected ?? false);
		});
		return unsub;
	}, [setOnline]);

	return null;
}

function AuthHydrator() {
	useEffect(() => {
		void useAuth.getState().hydrate();
	}, []);

	return null;
}

export default function RootLayout() {
	const [fontsLoaded] = useFonts({ Merriweather_400Regular, Merriweather_700Bold });

	useEffect(() => {
		if (fontsLoaded) void SplashScreen.hideAsync();
	}, [fontsLoaded]);

	if (!fontsLoaded) return null;

	return (
		<SafeAreaProvider>
			<QueryClientProvider client={queryClient}>
				<AuthHydrator />
				<NetInfoMonitor />
				<Stack screenOptions={{ headerShown: false, gestureEnabled: true }} />
				<Toast />
			</QueryClientProvider>
		</SafeAreaProvider>
	);
}
