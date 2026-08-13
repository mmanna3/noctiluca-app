import { pedirSync } from "@/sync/pedir-sync";
import { useEstadoSync } from "@/sync/estado-sync";
import { EstadoGuardado } from "@/sync/tipos";
import { TouchableOpacity, Text, View } from "react-native";
import Toast from "react-native-toast-message";

const textoGlobal: Record<EstadoGuardado, string> = {
	guardado: "Sincronizado ✓",
	guardando: "Pendiente de subir",
	pendiente: "Pendiente de subir",
	"sin-conexion": "Sin conexión",
	error: "Error al sincronizar",
};

const colorTexto = (estado: EstadoGuardado, online: boolean): string => {
	if (estado === "error") return "text-red-500";
	if (!online || estado === "sin-conexion") return "text-amber-600";
	if (estado === "guardando" || estado === "pendiente") return "text-amber-600";
	return "text-gray-500";
};

const IndicadorSync = () => {
	const online = useEstadoSync((s) => s.online);
	const pendientes = useEstadoSync((s) => s.pendientes);
	const estado = useEstadoSync((s) => s.estado);
	const sincronizando = useEstadoSync((s) => s.sincronizando);
	const syncInicialCompleto = useEstadoSync((s) => s.syncInicialCompleto);

	const etiqueta =
		sincronizando || (!syncInicialCompleto && online)
			? "Sincronizando…"
			: textoGlobal[estado];
	const claseTexto =
		sincronizando || (!syncInicialCompleto && online)
			? "text-gray-500"
			: colorTexto(estado, online);

	const alPresionar = () => {
		if (!online) {
			Toast.show({ type: "error", text1: "Sin conexión — no se puede sincronizar ahora" });
			return;
		}
		pedirSync();
	};

	return (
		<View className="flex-row justify-end w-full pt-3 pb-0">
			<TouchableOpacity
				onPress={alPresionar}
				disabled={sincronizando}
				accessibilityLabel={`Estado de sincronización: ${etiqueta}. Tocá para sincronizar.`}
				className={`flex-row items-center gap-1.5 ${sincronizando ? "opacity-80" : ""}`}
			>
				<Text className={`text-xs ${claseTexto}`}>{etiqueta}</Text>
				{pendientes > 0 && (
					<View className="min-w-[1.125rem] rounded-full bg-amber-100 px-1 items-center justify-center">
						<Text className="text-amber-800 text-[10px] font-medium leading-4 text-center">
							{pendientes > 99 ? "99+" : pendientes}
						</Text>
					</View>
				)}
			</TouchableOpacity>
		</View>
	);
};

export default IndicadorSync;
