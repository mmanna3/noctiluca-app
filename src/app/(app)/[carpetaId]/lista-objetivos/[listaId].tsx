import { api } from "@/api/api";
import { CrearItemObjetivoDTO, ItemObjetivoDTO } from "@/api/clients";
import { clavesObjetivos, queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { Input } from "@/components/ui/input-ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PuntoMarcador from "@/components/ui/punto-marcador";
import useNavegacion from "@/use-navegacion";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export default function ListaObjetivos() {
	const { irAlInicio, listaId } = useNavegacion();
	const queryClient = useQueryClient();
	const [nuevoTexto, setNuevoTexto] = useState("");
	const [creando, setCreando] = useState(false);

	const { data, isLoading, refetch } = useApiQuery({
		fn: () => api.lista2(Number(listaId)),
		key: queryKeys.objetivosLista(listaId),
		activado: !!listaId,
	});

	const items = data?.items ?? [];

	const toggleCompletado = async (item: ItemObjetivoDTO) => {
		if (!item.id) return;
		try {
			await api.completado(item.id);
			await refetch();
		} catch {
			Toast.show({ type: "error", text1: "Error al actualizar" });
		}
	};

	const agregarItem = async () => {
		if (!nuevoTexto.trim() || creando || !listaId) return;
		setCreando(true);
		try {
			await api.itemPOST(
				new CrearItemObjetivoDTO({
					texto: nuevoTexto.trim(),
					listaObjetivoId: data?.id,
					tipo: data?.tipo,
					clavePeriodo: data?.clavePeriodo,
				}),
			);
			setNuevoTexto("");
			await refetch();
		} catch {
			Toast.show({ type: "error", text1: "Error al agregar objetivo" });
		} finally {
			setCreando(false);
		}
	};

	const eliminarItem = async (id: number) => {
		try {
			await api.itemDELETE(id);
			await Promise.all(clavesObjetivos.map((k) => queryClient.invalidateQueries({ queryKey: k })));
			await refetch();
		} catch {
			Toast.show({ type: "error", text1: "Error al eliminar" });
		}
	};

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={irAlInicio}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					 /objetivos
				</Boton>
			</Encabezado>
			<View className="flex-row items-center gap-2 py-2">
				<View className="flex-1">
					<Input
						value={nuevoTexto}
						onChange={setNuevoTexto}
					/>
				</View>
				<TouchableOpacity
					onPress={agregarItem}
					disabled={creando}
					className="bg-slate-900 rounded-full h-10 w-10 items-center justify-center"
				>
					{creando ? <LoadingSpinner /> : <Ionicons name="add" size={24} color="white" />}
				</TouchableOpacity>
			</View>
			<Cuerpo className="flex-1">
				{isLoading ? (
					<View className="flex-1 justify-center items-center">
						<LoadingSpinner />
					</View>
				) : (
					<FlatList
						data={items}
						keyExtractor={(item) => String(item.id ?? item.clientId)}
						renderItem={({ item }) => (
							<View className="flex-row items-center py-2 border-b border-gray-100 gap-2">
								<PuntoMarcador
									marcado={item.completado ?? false}
									onClick={() => void toggleCompletado(item)}
								/>
								<Text
									className={`flex-1 text-sm ${item.completado ? "line-through text-gray-400" : "text-slate-900"}`}
								>
									{item.texto}
								</Text>
								{item.id && (
									<TouchableOpacity onPress={() => void eliminarItem(item.id!)} className="p-1">
										<Ionicons name="trash-outline" size={16} color="#94a3b8" />
									</TouchableOpacity>
								)}
							</View>
						)}
					/>
				)}
			</Cuerpo>
		</View>
	);
}
