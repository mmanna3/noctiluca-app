import { api } from "@/api/api";
import { queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import ListaItem from "@/components/ui/lista-item";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import usarNavegacion from "@/usar-navegacion";
import { FlatList, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ModoLectura() {
	const { irAlInicio, irAVerEscrito } = usarNavegacion();

	const { data, isLoading } = useApiQuery({
		fn: () => api.escritoAll(),
		key: queryKeys.escritos,
	});

	const escritos = (data ?? [])
		.filter((e) => !e.estaEnPapelera)
		.sort((a, b) => {
			const tA = a.fechaHoraCreacion ? new Date(a.fechaHoraCreacion).getTime() : 0;
			const tB = b.fechaHoraCreacion ? new Date(b.fechaHoraCreacion).getTime() : 0;
			return tB - tA;
		});

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={irAlInicio}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					 /modo-lectura
				</Boton>
			</Encabezado>
			<Cuerpo className="flex-1">
				{isLoading ? (
					<View className="flex-1 justify-center items-center">
						<LoadingSpinner />
					</View>
				) : escritos.length === 0 ? (
					<View className="flex-1 justify-center items-center">
						<Text className="text-sm text-gray-500">No hay escritos.</Text>
					</View>
				) : (
					<FlatList
						data={escritos}
						keyExtractor={(e) => String(e.id ?? e.clientId ?? e.titulo)}
						renderItem={({ item }) => (
							<ListaItem
								titulo={item.titulo ?? ""}
								subtitulo={`${item.carpetaTitulo ?? ""} · ${(item.cuerpo ?? "").slice(0, 60)}`}
								fecha={item.fechaHoraCreacion?.toString()}
								onClick={() => irAVerEscrito(String(item.id ?? item.clientId ?? ""), item.carpetaId)}
							/>
						)}
					/>
				)}
			</Cuerpo>
		</View>
	);
}
