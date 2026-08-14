import { api } from "@/api/api";
import { EscritoDTO } from "@/api/clients";
import { queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { Input } from "@/components/ui/input-ui";
import ListaItem from "@/components/ui/lista-item";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import useNavegacion from "@/use-navegacion";
import { MINIMO_CARACTERES_BUSQUEDA } from "@/utils/busqueda";
import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DEBOUNCE_MS = 300;

export default function BuscarEscritos() {
	const { irAlInicio, irAVerEscrito } = useNavegacion();
	const [textoBusqueda, setTextoBusqueda] = useState("");
	const [textoDebounced, setTextoDebounced] = useState("");

	useEffect(() => {
		const timer = setTimeout(() => setTextoDebounced(textoBusqueda.trim()), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [textoBusqueda]);

	const busquedaActiva = textoDebounced.length >= MINIMO_CARACTERES_BUSQUEDA;

	const { data, isLoading } = useApiQuery({
		key: queryKeys.buscarEscritos(textoDebounced),
		fn: () => api.buscar(textoDebounced),
		activado: busquedaActiva,
	});

	const resultados: EscritoDTO[] = data ?? [];

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={irAlInicio}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					Buscar
				</Boton>
			</Encabezado>
			<Cuerpo className="flex-1">
				<Input
					value={textoBusqueda}
					onChange={setTextoBusqueda}
					placeholder="Buscar escritos..."
				/>

				{!busquedaActiva && (
					<View className="flex-1 justify-center items-center">
						<Text className="text-sm text-gray-400">Escribí al menos {MINIMO_CARACTERES_BUSQUEDA} caracteres</Text>
					</View>
				)}

				{busquedaActiva && isLoading && (
					<View className="flex-1 justify-center items-center">
						<LoadingSpinner />
					</View>
				)}

				{busquedaActiva && !isLoading && resultados.length === 0 && (
					<View className="flex-1 justify-center items-center">
						<Text className="text-sm text-gray-500">Sin resultados</Text>
					</View>
				)}

				{busquedaActiva && !isLoading && resultados.length > 0 && (
					<FlatList
						data={resultados}
						keyExtractor={(e) => String(e.id ?? e.clientId)}
						renderItem={({ item }) => (
							<ListaItem
								titulo={item.titulo ?? ""}
								subtitulo={item.carpetaTitulo ?? ""}
								onClick={() => irAVerEscrito(
									String(item.id ?? item.clientId ?? ""),
									item.carpetaId,
								)}
							/>
						)}
					/>
				)}
			</Cuerpo>
		</View>
	);
}
