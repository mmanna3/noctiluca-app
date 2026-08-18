import { TipoHabitoEnum } from "@/api/clients";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PuntoMarcador from "@/components/ui/punto-marcador";
import useNavegacion from "@/use-navegacion";
import { useTrackerDia } from "@/sync/lecturas";
import { TrackerHabitoView } from "@/sync/lecturas-core";
import { guardarRegistroHabitoLocal } from "@/sync/repositorio-habitos";
import { useEffect, useState } from "react";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { diasDeSemana, esMismaFecha, inicioDeSemana, nombreDiaCorto } from "@/pantallas/habitos/utilidades-habitos";

export default function HabitosScreen() {
	const { irAlInicio, irAAdministrarHabitos, irAResumenHabitos } = useNavegacion();
	const [semanaReferencia, setSemanaReferencia] = useState(() => inicioDeSemana(new Date()));
	const [diaSeleccionado, setDiaSeleccionado] = useState(() => new Date());
	const diasSemana = diasDeSemana(semanaReferencia);
	const hoy = new Date();

	const data = useTrackerDia(diaSeleccionado);
	const isLoading = data === undefined;
	const habitos = data ?? [];

	const registrar = (habito: TrackerHabitoView, valor: boolean | number) => {
		void guardarRegistroHabitoLocal({
			habitoClientId: habito.clientId,
			habitoId: habito.id,
			fecha: diaSeleccionado,
			valorBooleano: typeof valor === "boolean" ? valor : undefined,
			valorNumerico: typeof valor === "number" ? valor : undefined,
		});
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
						keyExtractor={(h) => h.clientId}
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
	habito: TrackerHabitoView;
	fecha: Date;
	onRegistrar: (habito: TrackerHabitoView, valor: boolean | number) => void;
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
							if (!isNaN(val)) onRegistrar(habito, val);
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
					onRegistrar(habito, !marcado);
				}}
			/>
		</View>
	);
}
