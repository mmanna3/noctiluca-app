import { CarpetaDTO } from "@/api/clients";
import { Boton, BotonIcono } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import ListaItem from "@/components/ui/lista-item";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import useNavegacion from "@/use-navegacion";
import { useCarpeta } from "@/sync/lecturas";
import { eliminarCarpetaLocal } from "@/sync/repositorio-carpetas";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

const subtituloCarpeta = (c: CarpetaDTO): string => {
	const cantidad = c.cantidadDeEscritos ?? 0;
	if (cantidad === 1) return "1 escrito";
	return `${cantidad} escritos`;
};

export default function VerCarpeta() {
	const { irAlInicio, irACarpeta, irANuevoEscrito, irAVerEscrito, carpetaId } = useNavegacion();
	const [eliminando, setEliminando] = useState(false);

	const data = useCarpeta(carpetaId);

	const esSubcarpeta = data?.carpetaPadreId !== undefined && data?.carpetaPadreId !== null;

	const volver = () => {
		if (esSubcarpeta && data?.carpetaPadreId) irACarpeta(data.carpetaPadreId);
		else irAlInicio();
	};

	const eliminarCarpeta = async () => {
		if (!data?.clientId || eliminando) return;
		setEliminando(true);
		await eliminarCarpetaLocal(data.clientId);
		Toast.show({ type: "success", text1: `Carpeta '${data.titulo}' eliminada` });
		volver();
	};

	if (data === undefined) {
		return (
			<View className="flex-1 justify-center items-center">
				<LoadingSpinner />
			</View>
		);
	}

	const tieneSubcarpetas = !!(data?.cantidadDeSubCarpetas && data.cantidadDeSubCarpetas > 0);
	const tieneEscritos = !!(data?.cantidadDeEscritos && data.cantidadDeEscritos > 0);
	const esCarpetaSistema = data?.esSistema === true;
	const estaVacia = !tieneEscritos && !tieneSubcarpetas;

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={volver}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					/{data?.titulo ?? ""}
				</Boton>
				<BotonIcono onClick={() => irANuevoEscrito(data?.id ?? carpetaId)}>
					<Ionicons name="add" size={28} color="white" />
				</BotonIcono>
			</Encabezado>
			<Cuerpo className="flex-1">
				{estaVacia ? (
					<View className="flex-1 justify-center items-center">
						<Text className="text-sm text-gray-500">No hay escritos en esta carpeta.</Text>
						{!esCarpetaSistema && (
							<Boton soloBorde onClick={eliminarCarpeta} disabled={eliminando} className="mt-4">
								{eliminando ? <LoadingSpinner /> : "¿Eliminar carpeta?"}
							</Boton>
						)}
					</View>
				) : (
					<FlatList
						data={[
							...(tieneSubcarpetas ? (data?.subCarpetas ?? []) as CarpetaDTO[] : []).map(
								(c) => ({ tipo: "carpeta" as const, item: c }),
							),
							...(tieneEscritos ? (data?.escritos ?? []) : []).map(
								(e) => ({ tipo: "escrito" as const, item: e }),
							),
						]}
						keyExtractor={(x) => `${x.tipo}-${x.item.id ?? (x.item as { titulo?: string }).titulo}`}
						renderItem={({ item: x }) => {
							if (x.tipo === "carpeta") {
								const c = x.item as CarpetaDTO;
								const destino = c.id ?? c.clientId;
								return (
									<ListaItem
										titulo={c.titulo ?? ""}
										subtitulo={subtituloCarpeta(c)}
										onClick={() => destino !== undefined && irACarpeta(destino)}
									/>
								);
							}
							const e = x.item;
							return (
								<ListaItem
									titulo={(e as { titulo?: string }).titulo ?? ""}
									subtitulo={((e as { cuerpo?: string }).cuerpo ?? "").slice(0, 80)}
									fecha={(e as { fechaHoraCreacion?: Date | string }).fechaHoraCreacion?.toString()}
									onClick={() => irAVerEscrito(
										((e as { id?: number; clientId?: string }).id ?? (e as { clientId?: string }).clientId ?? "").toString(),
										carpetaId,
									)}
								/>
							);
						}}
					/>
				)}
			</Cuerpo>
		</View>
	);
}
