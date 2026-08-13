import IndicadorSync from "@/components/indicador-sync";
import { RequiereAutenticacion } from "@/components/requiere-autenticacion";
import { Slot } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppLayout() {
	return (
		<RequiereAutenticacion>
			<SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
				<View className="flex-1 px-5 max-w-2xl w-full self-center">
					<IndicadorSync />
					<View className="flex-1 pt-1">
						<Slot />
					</View>
				</View>
			</SafeAreaView>
		</RequiereAutenticacion>
	);
}
