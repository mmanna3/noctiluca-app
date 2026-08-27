import { PropositoCarpetaEnum, TipoListaObjetivoEnum } from "@/api/clients";
import { Text, TouchableOpacity, View } from "react-native";
import EditorListaObjetivos from "./editor-lista-objetivos";
import PlanificacionObjetivosDia from "./planificacion-objetivos-dia";
import useNavegacion from "@/use-navegacion";
import { useCarpetaPorProposito } from "@/sync/lecturas";
import { clavePeriodoActual, tituloPeriodoActual } from "@/utils/objetivos";

interface Props {
	tipo: TipoListaObjetivoEnum;
	proposito: PropositoCarpetaEnum;
}

/**
 * Pantalla completa de objetivos (día o semana), usada por los períodos
 * "Hoy" y "Semana" de la tab `objetivos`. Misma lógica que la rama de
 * objetivos de `[carpetaId]/escritos.tsx`, pero partiendo del propósito de
 * la carpeta en vez de su id de ruta.
 */
export default function PantallaObjetivos({ tipo, proposito }: Props) {
	const { irAHistoricoObjetivos } = useNavegacion();
	const carpetaId = useCarpetaPorProposito(proposito);
	const esObjetivosDia = tipo === TipoListaObjetivoEnum._1;
	const claveActual = clavePeriodoActual(tipo);
	const tituloActual = esObjetivosDia ? "Hoy" : tituloPeriodoActual(tipo);

	return (
		<View className="flex-1">
			<EditorListaObjetivos tipo={tipo} clavePeriodo={claveActual} titulo={tituloActual} />
			{esObjetivosDia && <PlanificacionObjetivosDia />}
			{carpetaId !== undefined && (
				<TouchableOpacity onPress={() => irAHistoricoObjetivos(Number(carpetaId))}>
					<Text className="text-xs text-gray-500 uppercase tracking-wide">Ver histórico →</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}
