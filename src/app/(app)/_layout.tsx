import IndicadorSync from "@/components/indicador-sync";
import { RequiereAutenticacion } from "@/components/requiere-autenticacion";
import { iniciarNotificacionesHabitos } from "@/notificaciones/notificaciones";
import { router, Slot } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Agenda y mantiene las notificaciones de hábitos (solo iPhone) mientras hay sesión. */
function NotificacionesHabitos() {
	useEffect(() => iniciarNotificacionesHabitos((ruta) => router.push(ruta as never)), []);
	return null;
}

export default function AppLayout() {
	return (
		<RequiereAutenticacion>
			<SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
				<NotificacionesHabitos />
				<View className="flex-1 px-5 max-w-2xl md:max-w-4xl md:px-8 w-full self-center">
					<IndicadorSync />
					<View className="flex-1 pt-1">
						<Slot />
					</View>
				</View>
			</SafeAreaView>
		</RequiereAutenticacion>
	);
}
