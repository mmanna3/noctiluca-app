import { api } from "@/api/api";
import { clavesEscritos, queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import useNavegacion from "@/use-navegacion";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export default function VerEscritoPapelera() {
	const { volverAPapelera, escritoId } = useNavegacion();
	const queryClient = useQueryClient();
	const [eliminando, setEliminando] = useState(false);

	const { data, isLoading } = useApiQuery({
		fn: () => api.escritoGET(Number(escritoId)),
		key: queryKeys.escrito(escritoId),
		activado: !!escritoId,
	});

	const eliminarDefinitivamente = async () => {
		if (!data?.id || eliminando) return;
		setEliminando(true);
		try {
			await api.escritoDELETE(data.id);
			await Promise.all(clavesEscritos.map((k) => queryClient.invalidateQueries({ queryKey: k })));
			Toast.show({ type: "success", text1: `'${data.titulo}' eliminado definitivamente` });
			volverAPapelera();
		} catch {
			Toast.show({ type: "error", text1: "Error al eliminar" });
			setEliminando(false);
		}
	};

	if (isLoading) {
		return (
			<View className="flex-1 justify-center items-center">
				<LoadingSpinner />
			</View>
		);
	}

	if (!data) {
		return (
			<View className="flex-1 justify-center items-center">
				<Text className="text-gray-500">No se encontró el escrito</Text>
			</View>
		);
	}

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={volverAPapelera}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					 Papelera/{data.titulo}
				</Boton>
				<Boton sinBorde onClick={eliminarDefinitivamente} disabled={eliminando}>
					{eliminando ? (
						<LoadingSpinner />
					) : (
						<Ionicons name="trash-outline" size={20} color="#94a3b8" />
					)}
				</Boton>
			</Encabezado>
			<Cuerpo className="flex-1">
				<Text className="text-xl font-semibold text-slate-900 mb-2">{data.titulo}</Text>
				<Text className="text-base text-slate-700">{data.cuerpo}</Text>
			</Cuerpo>
		</View>
	);
}
