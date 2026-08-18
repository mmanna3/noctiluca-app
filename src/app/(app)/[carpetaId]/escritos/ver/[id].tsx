import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAutoguardado } from "@/hooks/use-autoguardado";
import useNavegacion from "@/use-navegacion";
import { useEscrito } from "@/sync/lecturas";
import { cambiarPapeleraLocal } from "@/sync/repositorio-escritos";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export default function VerEscrito() {
	const { volverAEscritosHome, escritoId, carpetaId } = useNavegacion();
	const [eliminando, setEliminando] = useState(false);
	const [titulo, setTitulo] = useState("");
	const [cuerpo, setCuerpo] = useState("");
	const [inicializado, setInicializado] = useState<string | null>(null);

	const data = useEscrito(escritoId);

	useEffect(() => {
		if (data?.clientId && inicializado !== data.clientId) {
			setTitulo(data.titulo ?? "");
			setCuerpo(data.cuerpo ?? "");
			setInicializado(data.clientId);
		}
	}, [data, inicializado]);

	const { flush } = useAutoguardado(
		data?.clientId
			? {
				clientId: data.clientId,
				titulo: data.titulo ?? "",
				cuerpo: data.cuerpo ?? "",
				carpetaClientId: data.carpetaClientId,
				carpetaId: data.carpetaId,
			}
			: undefined,
		titulo,
		cuerpo,
	);

	const volver = () => {
		void flush();
		volverAEscritosHome();
	};

	const eliminarYVolver = async () => {
		if (!data?.clientId || eliminando) return;
		setEliminando(true);
		await cambiarPapeleraLocal(data.clientId, true);
		Toast.show({ type: "success", text1: `'${data.titulo}' al tacho` });
		volverAEscritosHome();
	};

	if (data === undefined) {
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
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
		</KeyboardAvoidingView>
	);
}
