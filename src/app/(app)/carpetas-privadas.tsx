import { api } from "@/api/api";
import { CarpetaDTO } from "@/api/clients";
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

export default function CarpetasPrivadas() {
	const { irAlInicio, verEscritosDeLaCarpeta } = usarNavegacion();

	const { data, isLoading } = useApiQuery({
		fn: () => api.carpetaAll(),
		key: queryKeys.carpetas,
	});

	const carpetasPrivadas = (data ?? []).filter((c) => c.requiereAutenticacion === true);

	const subtitulo = (c: CarpetaDTO) => {
		const n = c.cantidadDeEscritos ?? 0;
		return n === 1 ? "1 escrito" : `${n} escritos`;
	};

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={irAlInicio}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					 /privadas
				</Boton>
			</Encabezado>
			<Cuerpo className="flex-1">
				{isLoading ? (
					<View className="flex-1 justify-center items-center">
						<LoadingSpinner />
					</View>
				) : carpetasPrivadas.length === 0 ? (
					<View className="flex-1 justify-center items-center">
						<Text className="text-sm text-gray-500">No hay carpetas privadas.</Text>
					</View>
				) : (
					<FlatList
						data={carpetasPrivadas}
						keyExtractor={(c) => String(c.id ?? c.titulo)}
						renderItem={({ item }) => (
							<ListaItem
								titulo={item.titulo ?? ""}
								subtitulo={subtitulo(item)}
								icono={<Ionicons name="lock-closed" size={14} color="#9ca3af" />}
								onClick={() => item.id && verEscritosDeLaCarpeta(item.id)}
							/>
						)}
					/>
				)}
			</Cuerpo>
		</View>
	);
}
