import { api } from "@/api/api";
import { queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import ListaItem from "@/components/ui/lista-item";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import useNavegacion from "@/use-navegacion";
import { FlatList, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Papelera() {
	const { irAlInicio, irAVerEscrito } = useNavegacion();

	const { data, isLoading } = useApiQuery({
		fn: () => api.papelera(),
		key: queryKeys.papelera,
	});

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={irAlInicio}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					 /tacho
				</Boton>
			</Encabezado>
			<Cuerpo className="flex-1">
				{isLoading ? (
					<View className="flex-1 justify-center items-center">
						<LoadingSpinner />
					</View>
				) : (data ?? []).length === 0 ? (
					<View className="flex-1 justify-center items-center">
						<Text className="text-sm text-gray-500">El tacho está vacío.</Text>
					</View>
				) : (
					<FlatList
						data={data ?? []}
						keyExtractor={(item) => String(item.id ?? item.titulo)}
						renderItem={({ item }) => (
							<ListaItem
								titulo={item.titulo ?? ""}
								subtitulo={(item.cuerpo ?? "").slice(0, 80)}
								fecha={item.fechaHoraCreacion?.toString()}
								onClick={() => irAVerEscrito(
									String(item.id ?? item.clientId ?? ""),
									undefined,
								)}
							/>
						)}
					/>
				)}
			</Cuerpo>
		</View>
	);
}
