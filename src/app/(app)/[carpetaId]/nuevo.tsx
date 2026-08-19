import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { Input } from "@/components/ui/input-ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import useNavegacion from "@/use-navegacion";
import { useCarpeta } from "@/sync/lecturas";
import { crearEscritoLocal } from "@/sync/repositorio-escritos";
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function NuevoEscrito() {
	const { irAVerEscrito, carpetaId } = useNavegacion();
	const [titulo, setTitulo] = useState("");
	const [cuerpo, setCuerpo] = useState("");
	const [creando, setCreando] = useState(false);

	const carpeta = useCarpeta(carpetaId);

	const crearYAbrir = async () => {
		if (!carpetaId || creando) return;
		setCreando(true);
		const clientId = await crearEscritoLocal({
			titulo: titulo.trim() || "",
			cuerpo,
			carpetaClientId: carpeta?.clientId,
			carpetaId: carpeta?.id,
		});
		irAVerEscrito(clientId, carpetaId);
	};

	return (
		<ScrollView
			style={{ flex: 1 }}
			contentContainerStyle={{ flexGrow: 1 }}
			keyboardShouldPersistTaps="handled"
			automaticallyAdjustKeyboardInsets
		>
			<Encabezado>
				<Boton soloBorde onClick={crearYAbrir} disabled={creando || !carpetaId}>
					{creando ? (
						<LoadingSpinner />
					) : (
						<Ionicons name="chevron-back" size={16} color="#0f172a" />
					)}
					 Crear en /{carpeta?.titulo ?? "…"}
				</Boton>
			</Encabezado>
			<Cuerpo className="flex-1">
				<Input
					value={titulo}
					onChange={setTitulo}
				/>
				<View className="pt-4 flex-1">
					<TextInput
						value={cuerpo}
						onChangeText={setCuerpo}
						placeholder="Texto"
						multiline
						textAlignVertical="top"
						className="flex-1 text-base text-slate-900 border-b border-gray-200 py-2"
					/>
				</View>
			</Cuerpo>
		</ScrollView>
	);
}
