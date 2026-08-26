import { CarpetaDTO, PropositoCarpetaEnum, TipoListaObjetivoEnum } from "@/api/clients";
import { Boton, BotonIcono } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ListaItem from "@/components/ui/lista-item";
import { useAuth } from "@/hooks/use-auth";
import useNavegacion from "@/use-navegacion";
import HabitTrackerHome from "@/pantallas/habitos/habit-tracker-home";
import EditorListaObjetivos from "@/pantallas/objetivos/editor-lista-objetivos";
import { useCarpetaPorProposito, useCarpetasRaiz } from "@/sync/lecturas";
import { claveDia, claveSemana, esCarpetaObjetivos } from "@/utils/objetivos";
import { FlatList, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MAX_OBJETIVOS_EN_INICIO = 3;

const subtituloCarpeta = (c: CarpetaDTO): string => {
	const cantidad = c.cantidadDeEscritos ?? 0;
	if (cantidad === 1) return "1 escrito";
	return `${cantidad} escritos`;
};

export default function Inicio() {
	const { irANuevaCarpeta, irALogin, irAPapelera, irAHabitos, irABuscarEscritos, verEscritosDeLaCarpeta, irACarpeta } =
		useNavegacion();

	const data = useCarpetasRaiz();
	const carpetaObjetivosDia = useCarpetaPorProposito(PropositoCarpetaEnum._2);
	const carpetaObjetivosSemana = useCarpetaPorProposito(PropositoCarpetaEnum._3);

	const cerrarSesion = () => {
		useAuth.getState().logout();
		irALogin();
	};

	if (data === undefined) {
		return (
			<View className="flex-1 justify-center items-center gap-2">
				<LoadingSpinner />
			</View>
		);
	}

	// La carpeta de sistema "objetivos" (y sus subcarpetas día/semana/mes) ya se
	// muestran arriba como secciones dedicadas; no tiene sentido repetirla acá.
	const carpetasRaiz = data.filter((c) => !esCarpetaObjetivos(c.propositoCarpeta));

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
				<EditorListaObjetivos
					tipo={TipoListaObjetivoEnum._1}
					clavePeriodo={claveDia(new Date())}
					titulo="Objetivos diarios"
					maxVisibles={MAX_OBJETIVOS_EN_INICIO}
					onVerTodos={() => carpetaObjetivosDia !== undefined && irACarpeta(carpetaObjetivosDia)}
				/>
				<EditorListaObjetivos
					tipo={TipoListaObjetivoEnum._2}
					clavePeriodo={claveSemana(new Date())}
					titulo="Objetivos semanales"
					maxVisibles={MAX_OBJETIVOS_EN_INICIO}
					onVerTodos={() => carpetaObjetivosSemana !== undefined && irACarpeta(carpetaObjetivosSemana)}
				/>
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
