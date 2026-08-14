import { api } from "@/api/api";
import { CarpetaDTO } from "@/api/clients";
import { queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { Boton, BotonIcono } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ListaItem from "@/components/ui/lista-item";
import { useAuth } from "@/hooks/use-auth";
import useNavegacion from "@/use-navegacion";
import HabitTrackerHome from "@/pantallas/habitos/habit-tracker-home";
import { FlatList, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const subtituloCarpeta = (c: CarpetaDTO): string => {
	const cantidad = c.cantidadDeEscritos ?? 0;
	if (cantidad === 1) return "1 escrito";
	return `${cantidad} escritos`;
};

export default function Inicio() {
	const { irANuevaCarpeta, irALogin, irAPapelera, irAHabitos, irABuscarEscritos, verEscritosDeLaCarpeta } = useNavegacion();

	const { data, isLoading } = useApiQuery({
		fn: () => api.carpetaAll(),
		key: queryKeys.carpetas,
	});

	const cerrarSesion = () => {
		useAuth.getState().logout();
		irALogin();
	};

	if (isLoading) {
		return (
			<View className="flex-1 justify-center items-center gap-2">
				<LoadingSpinner />
			</View>
		);
	}

	const carpetasRaiz = (data ?? []).filter(
		(c) => c.carpetaPadreId === undefined || c.carpetaPadreId === null,
	);

	return (
		<View className="flex-1">
			<Encabezado>
				<View className="flex-row items-center gap-1">
					<Boton soloBorde onClick={irAHabitos}>
						/
					</Boton>
				</View>
				<BotonIcono onClick={irANuevaCarpeta}>
					<Ionicons name="add" size={28} color="white" />
				</BotonIcono>
			</Encabezado>
			<Cuerpo className="flex-1">
				<HabitTrackerHome onVerTodos={irAHabitos} />
				<FlatList
					data={carpetasRaiz}
					keyExtractor={(item) => String(item.id ?? item.titulo)}
					renderItem={({ item }) => (
						<ListaItem
							titulo={item.titulo ?? ""}
							subtitulo={subtituloCarpeta(item)}
							icono={
								item.requiereAutenticacion ? (
									<Ionicons name="lock-closed" size={14} color="#9ca3af" />
								) : undefined
							}
							onClick={() => item.id && verEscritosDeLaCarpeta(item.id)}
						/>
					)}
				/>
			</Cuerpo>
			<View className="flex-row justify-between w-full mt-auto pt-2 pb-2">
				<Boton soloBorde onClick={cerrarSesion}>
					<Ionicons name="close" size={24} color="#0f172a" />
				</Boton>
				<View className="flex-row items-center gap-1">
					<Boton soloBorde onClick={irABuscarEscritos}>
						<Ionicons name="search-outline" size={20} color="#0f172a" />
					</Boton>
					<Boton soloBorde onClick={irAPapelera}>
						<Ionicons name="trash-outline" size={20} color="#0f172a" />
					</Boton>
				</View>
			</View>
		</View>
	);
}
