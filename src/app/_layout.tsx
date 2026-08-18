import "../global.css";

import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { iniciarSync } from "@/sync/sync-engine";
import { useAuth } from "@/hooks/use-auth";
import { useFonts, Merriweather_400Regular, Merriweather_700Bold } from "@expo-google-fonts/merriweather";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			staleTime: 30_000,
		},
	},
});

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
	const [fontsLoaded] = useFonts({ Merriweather_400Regular, Merriweather_700Bold });

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
					<Stack screenOptions={{ headerShown: false, gestureEnabled: true }} />
					<Toast />
				</QueryClientProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
