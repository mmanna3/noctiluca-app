import { CarpetaDTO } from "@/api/clients";
import { Boton, BotonIcono } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ListaItem from "@/components/ui/lista-item";
import useNavegacion from "@/use-navegacion";
import HabitTrackerHome from "@/pantallas/habitos/habit-tracker-home";
import { useCarpetasRaiz } from "@/sync/lecturas";
import { esCarpetaObjetivos } from "@/utils/objetivos";
import { FlatList, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const subtituloCarpeta = (c: CarpetaDTO): string => {
	const cantidad = c.cantidadDeEscritos ?? 0;
	if (cantidad === 1) return "1 escrito";
	return `${cantidad} escritos`;
};

export default function Inicio() {
	const { irANuevaCarpeta, irAHabitos, irABuscarEscritos, verEscritosDeLaCarpeta } = useNavegacion();

	const data = useCarpetasRaiz();

	if (data === undefined) {
		return (
			<View className="flex-1 justify-center items-center gap-2">
				<LoadingSpinner />
			</View>
		);
	}

	// La carpeta de sistema "objetivos" (y sus subcarpetas día/semana/mes) ahora
	// se muestran en sus propias tabs; no tiene sentido repetirla acá.
	const carpetasRaiz = data.filter((c) => !esCarpetaObjetivos(c.propositoCarpeta));

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={irAHabitos}>
					/
				</Boton>
				<View className="flex-row items-center gap-1">
					<Boton soloBorde onClick={irABuscarEscritos}>
						<Ionicons name="search-outline" size={20} color="#0f172a" />
					</Boton>
					<BotonIcono onClick={irANuevaCarpeta}>
						<Ionicons name="add" size={28} color="white" />
					</BotonIcono>
				</View>
			</Encabezado>
			<Cuerpo className="flex-1">
				<HabitTrackerHome onVerTodos={irAHabitos} />
				<Text className="text-sm font-semibold text-slate-800 mb-2">Carpetas</Text>
				<FlatList
					data={carpetasRaiz}
					keyExtractor={(item) => String(item.id ?? item.clientId ?? item.titulo)}
					renderItem={({ item }) => (
						<ListaItem
							titulo={item.titulo ?? ""}
							subtitulo={subtituloCarpeta(item)}
							icono={
								item.requiereAutenticacion ? (
									<Ionicons name="lock-closed" size={14} color="#9ca3af" />
								) : undefined
							}
							onClick={() => {
								const destino = item.id ?? item.clientId;
								if (destino !== undefined) verEscritosDeLaCarpeta(destino);
							}}
						/>
					)}
				/>
			</Cuerpo>
		</View>
	);
}
