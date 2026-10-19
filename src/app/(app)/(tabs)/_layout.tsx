import { estiloFuente } from "@/components/ui/texto";
import { Tabs } from "expo-router";

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarIcon: () => null,
				tabBarActiveTintColor: "#0f172a",
				tabBarInactiveTintColor: "#94a3b8",
				// Con su altura de línea natural y pudiendo encogerse (el lugar del ícono vacío ocupa la
				// pestaña), la etiqueta se cortaba abajo con fuentes más altas que la del sistema.
				tabBarLabelStyle: { ...estiloFuente(400), lineHeight: 14, flexShrink: 0 },
				tabBarStyle: { backgroundColor: "#ffffff" },
				sceneStyle: { backgroundColor: "#ffffff" },
			}}
		>
			<Tabs.Screen name="index" options={{ title: "/" }} />
			<Tabs.Screen name="objetivos" options={{ title: "objetivos" }} />
		</Tabs>
	);
}
