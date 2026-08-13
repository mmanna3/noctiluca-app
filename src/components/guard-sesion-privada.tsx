import PedirPassword from "@/components/pedir-password";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSesionPrivada } from "@/hooks/use-sesion-privada";
import { evaluarDestinoPrivado } from "@/privacidad/privacidad-core";
import { Slot, usePathname, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

const GuardSesionPrivada = () => {
	const pathname = usePathname();
	const params = useLocalSearchParams<{ carpetaId?: string; id?: string }>();

	// En fase online-only no hay carpetas locales: se asume lista vacía.
	// Phase 7 (expo-sqlite) inyectará las carpetas reales desde la DB local.
	const carpetas: never[] = [];

	const sesionActiva = useSesionPrivada((s) => s.sesionActiva());

	const motivo = evaluarDestinoPrivado(pathname, params, carpetas);

	if (motivo && !sesionActiva) {
		return <PedirPassword motivo={motivo} />;
	}

	if (carpetas === undefined) {
		return (
			<View className="flex-1 items-center justify-center min-h-[40vh]">
				<LoadingSpinner />
			</View>
		);
	}

	return <Slot />;
};

export default GuardSesionPrivada;
