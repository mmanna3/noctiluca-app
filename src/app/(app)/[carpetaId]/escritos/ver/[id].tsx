import { api } from "@/api/api";
import { clavesEscritos, queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAutoguardado } from "@/hooks/use-autoguardado";
import useNavegacion from "@/use-navegacion";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export default function VerEscrito() {
	const { volverAEscritosHome, escritoId, carpetaId } = useNavegacion();
	const queryClient = useQueryClient();
	const [eliminando, setEliminando] = useState(false);
	const [titulo, setTitulo] = useState("");
	const [cuerpo, setCuerpo] = useState("");
	const [inicializado, setInicializado] = useState<number | null>(null);

	const { data, isLoading } = useApiQuery({
		fn: () => api.escritoGET(Number(escritoId)),
		key: queryKeys.escrito(escritoId),
		activado: !!escritoId,
	});

	useEffect(() => {
		if (data?.id && inicializado !== data.id) {
			setTitulo(data.titulo ?? "");
			setCuerpo(data.cuerpo ?? "");
			setInicializado(data.id);
		}
	}, [data, inicializado]);

	const { flush } = useAutoguardado(
		data ? { id: data.id, titulo: data.titulo ?? "", cuerpo: data.cuerpo ?? "", carpetaId: data.carpetaId } : undefined,
		titulo,
		cuerpo,
	);

	const volver = () => {
		void flush();
		volverAEscritosHome();
	};

	const eliminarYVolver = async () => {
		if (!data?.id || eliminando) return;
		setEliminando(true);
		try {
			await api.ponerEnPapelera(data.id);
			await Promise.all(clavesEscritos.map((k) => queryClient.invalidateQueries({ queryKey: k })));
			Toast.show({ type: "success", text1: `'${data.titulo}' al tacho` });
			volverAEscritosHome();
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
				<Boton soloBorde onClick={volver}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					{data.carpetaTitulo ?? ""}/{titulo}
				</Boton>
				<Boton sinBorde onClick={eliminarYVolver} disabled={eliminando}>
					{eliminando ? (
						<LoadingSpinner />
					) : (
						<Ionicons name="trash-outline" size={20} color="#94a3b8" />
					)}
				</Boton>
			</Encabezado>
			<Cuerpo className="flex-1">
				<TextInput
					value={titulo}
					onChangeText={setTitulo}
					placeholder="Título"
					className="text-xl font-semibold text-slate-900 border-b border-gray-100 py-2 mb-2"
				/>
				<TextInput
					value={cuerpo}
					onChangeText={setCuerpo}
					placeholder="Texto"
					multiline
					textAlignVertical="top"
					className="flex-1 text-base text-slate-900"
				/>
			</Cuerpo>
		</View>
	);
}
