import { api } from "@/api/api";
import { HistoricoObjetivoDTO, TipoListaObjetivoEnum } from "@/api/clients";
import { queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import ListaItem from "@/components/ui/lista-item";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import useNavegacion from "@/use-navegacion";
import { etiquetaPeriodo, inicioDeDiaLocal } from "@/utils/objetivos";
import { propositoATipo } from "@/utils/objetivos";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HistoricoObjetivos() {
	const { carpetaId, irACarpeta, irAListaObjetivos } = useNavegacion();

	const { data: carpeta, isLoading: cargandoCarpeta } = useApiQuery({
		fn: () => api.carpetaGET(Number(carpetaId)),
		key: queryKeys.carpeta(carpetaId),
		activado: !!carpetaId,
	});

	const tipo = propositoATipo(carpeta?.propositoCarpeta);

	const { data, isLoading, isError } = useApiQuery({
		key: [...queryKeys.objetivosHistorico(tipo ?? 0), 1],
		fn: () => api.historico(tipo, 1, 50),
		activado: tipo !== undefined,
	});

	const volver = () => {
		if (carpetaId) irACarpeta(Number(carpetaId));
	};

	if (cargandoCarpeta || isLoading) {
		return (
			<View className="flex-1 justify-center items-center">
				<LoadingSpinner />
			</View>
		);
	}

	if (isError) {
		return (
			<View className="flex-1">
				<Encabezado>
					<Boton soloBorde onClick={volver}>
						<Ionicons name="chevron-back" size={16} color="#0f172a" />
						Histórico
					</Boton>
				</Encabezado>
				<View className="flex-1 justify-center items-center">
					<Text className="text-sm text-red-500">Error al cargar el histórico</Text>
				</View>
			</View>
		);
	}

	const itemsBrutos = data?.items ?? [];
	const hoy = inicioDeDiaLocal(new Date());
	const items =
		tipo === TipoListaObjetivoEnum._1
			? itemsBrutos.filter((item) => {
				if (!item.fechaInicio) return true;
				const inicio = inicioDeDiaLocal(new Date(item.fechaInicio));
				return inicio.getTime() <= hoy.getTime();
			})
			: itemsBrutos;

	const subtitulo = (item: HistoricoObjetivoDTO) =>
		`${item.cantidadCompletados ?? 0}/${item.cantidadItems ?? 0} completados`;

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
							key={item.id}
							titulo={etiquetaPeriodo(
								item.tipo ?? tipo ?? TipoListaObjetivoEnum._1,
								item.clavePeriodo ?? "",
								item.fechaInicio,
								item.fechaFin,
							)}
							subtitulo={subtitulo(item)}
							onClick={() => {
								if (item.id && carpetaId) irAListaObjetivos(Number(carpetaId), item.id);
							}}
						/>
					))
				)}
			</Cuerpo>
		</View>
	);
}
