import "../global.css";

import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEstadoSync } from "@/sync/estado-sync";
import { useAuth } from "@/hooks/use-auth";

SplashScreen.preventAutoHideAsync();

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
		useAuth.persist.rehydrate();
	}, []);

	return null;
}

export default function RootLayout() {
	useEffect(() => {
		SplashScreen.hideAsync();
	}, []);

	return (
		<SafeAreaProvider>
			<QueryClientProvider client={queryClient}>
				<AuthHydrator />
				<NetInfoMonitor />
				<Stack screenOptions={{ headerShown: false }} />
				<Toast />
			</QueryClientProvider>
		</SafeAreaProvider>
	);
}
