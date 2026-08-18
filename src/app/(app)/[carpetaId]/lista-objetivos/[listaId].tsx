import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import EditorListaObjetivos from "@/pantallas/objetivos/editor-lista-objetivos";
import useNavegacion from "@/use-navegacion";
import { useListaObjetivosPorId } from "@/sync/lecturas";
import { etiquetaPeriodo } from "@/utils/objetivos";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ListaObjetivos() {
	const { irAlInicio, listaId } = useNavegacion();

	const data = useListaObjetivosPorId(listaId ? Number(listaId) : undefined);

	if (data === undefined) {
		return (
			<View className="flex-1 justify-center items-center">
				<LoadingSpinner />
			</View>
		);
	}

	if (!data || data.tipo == null || !data.clavePeriodo) {
		return (
			<View className="flex-1 justify-center items-center">
				<Text className="text-gray-500">No se encontró la lista de objetivos</Text>
			</View>
		);
	}

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={irAlInicio}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					 /objetivos
				</Boton>
			</Encabezado>
			<Cuerpo className="flex-1">
				<EditorListaObjetivos
					tipo={data.tipo}
					clavePeriodo={data.clavePeriodo}
					titulo={etiquetaPeriodo(data.tipo, data.clavePeriodo, data.fechaInicio, data.fechaFin)}
				/>
			</Cuerpo>
		</View>
	);
}
