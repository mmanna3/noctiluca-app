import { Tabs } from "expo-router";

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarIcon: () => null,
				tabBarActiveTintColor: "#0f172a",
				tabBarInactiveTintColor: "#94a3b8",
				tabBarStyle: { backgroundColor: "#ffffff" },
				sceneStyle: { backgroundColor: "#ffffff" },
			}}
		>
			<Tabs.Screen name="index" options={{ title: "/" }} />
			<Tabs.Screen name="objetivos" options={{ title: "objetivos" }} />
		</Tabs>
	);
}
