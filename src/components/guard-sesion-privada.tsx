import PedirPassword from "@/components/pedir-password";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSesionPrivada } from "@/hooks/use-sesion-privada";
import { evaluarDestinoPrivado } from "@/privacidad/privacidad-core";
import { useTodasLasCarpetasLocal } from "@/sync/lecturas";
import { Slot, usePathname, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

const GuardSesionPrivada = () => {
	const pathname = usePathname();
	const params = useLocalSearchParams<{ carpetaId?: string; id?: string }>();

	const carpetas = useTodasLasCarpetasLocal();

	const sesionActiva = useSesionPrivada((s) => s.sesionActiva());

	if (carpetas === undefined) {
		return (
			<View className="flex-1 items-center justify-center min-h-[40vh]">
				<LoadingSpinner />
			</View>
		);
	}

	const motivo = evaluarDestinoPrivado(pathname, params, carpetas);

	if (motivo && !sesionActiva) {
		return <PedirPassword motivo={motivo} />;
	}

	return <Slot />;
};

export default GuardSesionPrivada;
