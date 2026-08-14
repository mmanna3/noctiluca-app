import { api } from "@/api/api";
import { HabitoTrackerItemDTO, TipoHabitoEnum, UpsertRegistroHabitoDTO } from "@/api/clients";
import { clavesHabitos, queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PuntoMarcador from "@/components/ui/punto-marcador";
import useNavegacion from "@/use-navegacion";
import { fechaCalendarioLocal } from "@/sync/fechas";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { diasDeSemana, esMismaFecha, inicioDeSemana, nombreDiaCorto } from "@/pantallas/habitos/utilidades-habitos";

export default function HabitosScreen() {
	const { irAlInicio, irAAdministrarHabitos, irAResumenHabitos } = useNavegacion();
	const queryClient = useQueryClient();
	const [semanaReferencia, setSemanaReferencia] = useState(() => inicioDeSemana(new Date()));
	const [diaSeleccionado, setDiaSeleccionado] = useState(() => new Date());
	const diasSemana = diasDeSemana(semanaReferencia);
	const hoy = new Date();

	const { data, isLoading, refetch } = useApiQuery({
		fn: () => api.tracker(fechaCalendarioLocal(diaSeleccionado)),
		key: [...queryKeys.habitosTracker, diaSeleccionado.toDateString()],
	});

	const habitos = data?.habitos ?? [];

	const registrar = async (habito: HabitoTrackerItemDTO, valor: boolean | number) => {
		if (!habito.id) return;
		try {
			await api.registro(new UpsertRegistroHabitoDTO({
				habitoId: habito.id,
				fecha: fechaCalendarioLocal(diaSeleccionado),
				valorBooleano: typeof valor === "boolean" ? valor : undefined,
				valorNumerico: typeof valor === "number" ? valor : undefined,
			}));
		} catch {
			Toast.show({ type: "error", text1: "Error al guardar el hábito" });
		} finally {
			await refetch();
		}
	};

	const irSemanaAnterior = () => {
		setSemanaReferencia((prev) => {
			const d = new Date(prev);
			d.setDate(d.getDate() - 7);
			return d;
		});
	};

	const irSemanaSiguiente = () => {
		setSemanaReferencia((prev) => {
			const d = new Date(prev);
			d.setDate(d.getDate() + 7);
			return d;
		});
	};

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={irAlInicio}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					 /hábitos
				</Boton>
				<View className="flex-row gap-1">
					<TouchableOpacity onPress={irAResumenHabitos} className="p-2">
						<Ionicons name="bar-chart-outline" size={20} color="#64748b" />
					</TouchableOpacity>
					<TouchableOpacity onPress={irAAdministrarHabitos} className="p-2">
						<Ionicons name="settings-outline" size={20} color="#64748b" />
					</TouchableOpacity>
				</View>
			</Encabezado>

			<View className="flex-row justify-between items-center py-2">
				<TouchableOpacity onPress={irSemanaAnterior} className="p-2">
					<Ionicons name="chevron-back" size={20} color="#0f172a" />
				</TouchableOpacity>
				<View className="flex-row gap-1">
					{diasSemana.map((dia) => {
						const esHoy = esMismaFecha(dia, hoy);
						const esSeleccionado = esMismaFecha(dia, diaSeleccionado);
						return (
							<TouchableOpacity
								key={dia.toISOString()}
								onPress={() => setDiaSeleccionado(new Date(dia))}
								className={`items-center px-2 py-1 rounded ${esSeleccionado ? "bg-slate-900" : esHoy ? "bg-slate-100" : ""}`}
							>
								<Text className={`text-xs ${esSeleccionado ? "text-white" : "text-gray-600"}`}>
									{nombreDiaCorto(dia)}
								</Text>
								<Text className={`text-sm font-medium ${esSeleccionado ? "text-white" : "text-slate-900"}`}>
									{dia.getDate()}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
				<TouchableOpacity onPress={irSemanaSiguiente} className="p-2">
					<Ionicons name="chevron-forward" size={20} color="#0f172a" />
				</TouchableOpacity>
			</View>

			<Cuerpo className="flex-1">
				{isLoading ? (
					<View className="flex-1 justify-center items-center">
						<LoadingSpinner />
					</View>
				) : habitos.length === 0 ? (
					<View className="flex-1 justify-center items-center">
						<Text className="text-sm text-gray-500">No hay hábitos activos.</Text>
					</View>
				) : (
					<FlatList
						data={habitos}
						keyExtractor={(h) => String(h.id)}
						renderItem={({ item: habito }) => (
							<HabitoCelda
								habito={habito}
								fecha={diaSeleccionado}
								onRegistrar={registrar}
							/>
						)}
					/>
				)}
			</Cuerpo>
		</View>
	);
}

interface HabitoCeldaProps {
	habito: HabitoTrackerItemDTO;
	fecha: Date;
	onRegistrar: (habito: HabitoTrackerItemDTO, valor: boolean | number) => Promise<void>;
}

function HabitoCelda({ habito, fecha, onRegistrar }: HabitoCeldaProps) {
	const esNumerico = habito.tipo === TipoHabitoEnum._2;
	const [marcado, setMarcado] = useState(habito.valorBooleano === true);
	const [inputValor, setInputValor] = useState(
		habito.valorNumerico != null ? String(habito.valorNumerico) : "",
	);

	useEffect(() => {
		setMarcado(habito.valorBooleano === true);
	}, [habito.valorBooleano]);

	if (esNumerico) {
		return (
			<View className="flex-row items-center justify-between py-3 border-b border-gray-100 px-1">
				<Text className="text-sm font-medium text-slate-900 flex-1">{habito.nombre}</Text>
				<View className="flex-row items-center gap-2">
					<TextInput
						value={inputValor}
						onChangeText={setInputValor}
						onEndEditing={() => {
							const val = parseInt(inputValor, 10);
							if (!isNaN(val)) void onRegistrar(habito, val);
						}}
						keyboardType="numeric"
						className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm"
					/>
					{habito.metaMinutos && (
						<Text className="text-xs text-gray-400">/{habito.metaMinutos}</Text>
					)}
				</View>
			</View>
		);
	}

	return (
		<View className="flex-row items-center justify-between py-3 border-b border-gray-100 px-1">
			<Text className="text-sm font-medium text-slate-900 flex-1">{habito.nombre}</Text>
			<PuntoMarcador
				marcado={marcado}
				onClick={() => {
					setMarcado((v) => !v);
					void onRegistrar(habito, !marcado);
				}}
			/>
		</View>
	);
}
