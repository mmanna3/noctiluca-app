import { api } from "@/api/api";
import { HabitoResumenDTO } from "@/api/clients";
import { queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import useNavegacion from "@/use-navegacion";
import { fechaCalendarioLocal } from "@/sync/fechas";
import { diasDeSemana, esHabitoNumerico, formatearFechaClave, inicioDeSemana, nombreDiaCorto } from "@/pantallas/habitos/utilidades-habitos";
import { useMemo, useState } from "react";
import { FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const iconoEstado = (estado?: string): string => {
	switch (estado) {
	case "cumplido": return "✓";
	case "no_cumplido": return "✗";
	default: return "—";
	}
};

function TablaHabito({ habito, diasSemana }: { habito: HabitoResumenDTO; diasSemana: Date[] }) {
	const numerico = esHabitoNumerico(habito.tipo);
	return (
		<View className="mb-6">
			<Text className="text-sm font-medium text-slate-900 mb-2">{habito.nombre}</Text>
			<ScrollView horizontal showsHorizontalScrollIndicator={false}>
				<View>
					<View className="flex-row">
						{diasSemana.map((dia) => (
							<View key={formatearFechaClave(dia)} className="w-10 items-center border border-gray-200 py-1">
								<Text className="text-xs text-gray-500">{nombreDiaCorto(dia)}</Text>
								<Text className="text-xs text-gray-400">{dia.getDate()}</Text>
							</View>
						))}
						<View className="w-12 items-center border border-gray-200 py-1">
							<Text className="text-xs text-gray-500">Total</Text>
						</View>
					</View>
					<View className="flex-row">
						{habito.detallePorDia?.map((detalle, i) => (
							<View key={i} className="w-10 items-center border border-gray-200 py-2">
								<Text className="text-sm">
									{numerico && detalle.valorNumerico != null
										? String(detalle.valorNumerico)
										: iconoEstado(detalle.estado)}
								</Text>
							</View>
						))}
						<View className="w-12 items-center border border-gray-200 py-2">
							<Text className="text-xs font-medium text-slate-900">{habito.diasCumplidos ?? 0}/7</Text>
						</View>
					</View>
				</View>
			</ScrollView>
			{numerico && (
				<Text className="text-xs text-gray-500 mt-1">
					Total: {habito.totalMinutos ?? 0} min · Promedio: {habito.promedioMinutos ?? 0} min/día
				</Text>
			)}
		</View>
	);
}

export default function ResumenHabitos() {
	const { irAlInicio } = useNavegacion();
	const [semanaReferencia, setSemanaReferencia] = useState(() => new Date());

	const { data, isLoading } = useApiQuery({
		key: [...queryKeys.habitosResumenSemanal, formatearFechaClave(semanaReferencia)],
		fn: () => api.resumenSemanal(fechaCalendarioLocal(semanaReferencia)),
	});

	const diasSemana = useMemo(() => diasDeSemana(semanaReferencia), [semanaReferencia]);

	const semanaAnterior = () => {
		const nueva = new Date(semanaReferencia);
		nueva.setDate(nueva.getDate() - 7);
		setSemanaReferencia(nueva);
	};

	const semanaSiguiente = () => {
		const nueva = new Date(semanaReferencia);
		nueva.setDate(nueva.getDate() + 7);
		setSemanaReferencia(nueva);
	};

	const inicio = inicioDeSemana(semanaReferencia);
	const fin = diasSemana[6];

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={irAlInicio}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					Resumen semanal
				</Boton>
			</Encabezado>

			<View className="flex-row justify-between items-center py-2 px-4">
				<TouchableOpacity onPress={semanaAnterior} className="p-2">
					<Ionicons name="chevron-back" size={20} color="#0f172a" />
				</TouchableOpacity>
				<Text className="text-sm text-gray-500">
					{inicio.getDate()}/{inicio.getMonth() + 1} – {fin.getDate()}/{fin.getMonth() + 1}
				</Text>
				<TouchableOpacity onPress={semanaSiguiente} className="p-2">
					<Ionicons name="chevron-forward" size={20} color="#0f172a" />
				</TouchableOpacity>
			</View>

			<Cuerpo className="flex-1">
				{isLoading ? (
					<View className="flex-1 justify-center items-center">
						<LoadingSpinner />
					</View>
				) : !data?.habitos?.length ? (
					<View className="flex-1 justify-center items-center">
						<Text className="text-sm text-gray-500">No hay hábitos activos para mostrar.</Text>
					</View>
				) : (
					<FlatList
						data={data.habitos}
						keyExtractor={(h) => String(h.id)}
						renderItem={({ item }) => (
							<TablaHabito habito={item} diasSemana={diasSemana} />
						)}
					/>
				)}
			</Cuerpo>
		</View>
	);
}
