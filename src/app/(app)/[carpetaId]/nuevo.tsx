import { api } from "@/api/api";
import { EscritoDTO } from "@/api/clients";
import { clavesEscritos, queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { Input } from "@/components/ui/input-ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import usarNavegacion from "@/usar-navegacion";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export default function NuevoEscrito() {
	const { volverAEscritosHome, irAVerEscrito, carpetaId } = usarNavegacion();
	const [titulo, setTitulo] = useState("");
	const [cuerpo, setCuerpo] = useState("");
	const [creando, setCreando] = useState(false);
	const queryClient = useQueryClient();

	const { data: carpeta } = useApiQuery({
		fn: () => api.carpetaGET(Number(carpetaId)),
		key: queryKeys.carpeta(carpetaId),
		activado: !!carpetaId,
	});

	const crearYAbrir = async () => {
		if (!carpetaId || creando) return;
		setCreando(true);
		try {
			const escrito = await api.escritoPOST(
				new EscritoDTO({
					titulo: titulo.trim() || "",
					cuerpo,
					carpetaId: Number(carpetaId),
				}),
			);
			await Promise.all(clavesEscritos.map((k) => queryClient.invalidateQueries({ queryKey: k })));
			if (escrito.id) {
				irAVerEscrito(String(escrito.id), carpetaId);
			} else {
				volverAEscritosHome(carpetaId);
			}
		} catch {
			Toast.show({ type: "error", text1: "Error al crear el escrito" });
			setCreando(false);
		}
	};

	return (
		<View className="flex-1">
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
		</View>
	);
}
