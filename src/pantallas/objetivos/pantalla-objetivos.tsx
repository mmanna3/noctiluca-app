import { TipoListaObjetivoEnum } from "@/api/clients";
import { Text, TouchableOpacity, View } from "react-native";
import EditorListaObjetivos from "./editor-lista-objetivos";
import PlanificacionObjetivosDia from "./planificacion-objetivos-dia";
import useNavegacion from "@/use-navegacion";
import { clavePeriodoActual, tituloPeriodoActual } from "@/utils/objetivos";

interface Props {
	tipo: TipoListaObjetivoEnum;
}

/**
 * Pantalla completa de objetivos para un período (día/semana/mes/año/lustro),
 * usada por la tab `objetivos`. "Ver histórico →" navega directo por `tipo`,
 * sin pasar por una carpeta de sistema.
 */
export default function PantallaObjetivos({ tipo }: Props) {
	const { irAHistoricoObjetivos } = useNavegacion();
	const esObjetivosDia = tipo === TipoListaObjetivoEnum._1;
	const claveActual = clavePeriodoActual(tipo);
	const tituloActual = esObjetivosDia ? "Hoy" : tituloPeriodoActual(tipo);

	return (
		<View className="flex-1">
			<EditorListaObjetivos tipo={tipo} clavePeriodo={claveActual} titulo={tituloActual} />
			{esObjetivosDia && <PlanificacionObjetivosDia />}
			<TouchableOpacity onPress={() => irAHistoricoObjetivos(tipo)}>
				<Text className="text-xs text-gray-500 uppercase tracking-wide">Ver histórico →</Text>
			</TouchableOpacity>
		</View>
	);
}
