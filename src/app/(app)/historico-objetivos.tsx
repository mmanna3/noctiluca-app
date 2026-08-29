import { TipoListaObjetivoEnum } from "@/api/clients";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import ListaItem from "@/components/ui/lista-item";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import useNavegacion from "@/use-navegacion";
import { useHistoricoObjetivos } from "@/sync/lecturas";
import { HistoricoObjetivoResumen } from "@/sync/lecturas-core";
import { etiquetaPeriodo, inicioDeDiaLocal } from "@/utils/objetivos";
import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HistoricoObjetivos() {
	const { volver: volverNav, irAListaObjetivos } = useNavegacion();
	const { tipo: tipoParam } = useLocalSearchParams<{ tipo?: string }>();

	const tipo =
		tipoParam !== undefined ? (Number(tipoParam) as TipoListaObjetivoEnum) : undefined;
	const historico = useHistoricoObjetivos(tipo);

	const volver = () => volverNav("/objetivos");

	if (historico === undefined) {
		return (
			<View className="flex-1 justify-center items-center">
				<LoadingSpinner />
			</View>
		);
	}

	const hoy = inicioDeDiaLocal(new Date());
	const items =
		tipo === TipoListaObjetivoEnum._1
			? historico.filter((item) => {
				if (!item.fechaInicio) return true;
				return inicioDeDiaLocal(item.fechaInicio).getTime() <= hoy.getTime();
			})
			: historico;

	const subtitulo = (item: HistoricoObjetivoResumen) =>
		`${item.cantidadCompletados}/${item.cantidadItems} completados`;

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={volver}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					Histórico
				</Boton>
			</Encabezado>
			<Cuerpo className="flex-1">
				{items.length === 0 ? (
					<View className="flex-1 justify-center items-center">
						<Text className="text-sm text-gray-500 text-center">
							Todavía no hay listas con objetivos en este período.
						</Text>
					</View>
				) : (
					items.map((item) => (
						<ListaItem
							key={item.clientId ?? item.clavePeriodo}
							titulo={etiquetaPeriodo(
								item.tipo ?? tipo ?? TipoListaObjetivoEnum._1,
								item.clavePeriodo,
								item.fechaInicio,
								item.fechaFin,
							)}
							subtitulo={subtitulo(item)}
							onClick={() => {
								if (item.id) irAListaObjetivos(item.id);
							}}
						/>
					))
				)}
			</Cuerpo>
		</View>
	);
}
