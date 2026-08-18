import { TipoHabitoEnum } from "@/api/clients";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PuntoMarcador from "@/components/ui/punto-marcador";
import { useTrackerDia } from "@/sync/lecturas";
import { TrackerHabitoView } from "@/sync/lecturas-core";
import { guardarRegistroHabitoLocal } from "@/sync/repositorio-habitos";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { diasDeSemana, esMismaFecha, inicioDeSemana, nombreDiaCorto } from "./utilidades-habitos";

interface Props {
	onVerTodos: () => void;
}

export default function HabitTrackerHome({ onVerTodos }: Props) {
	const hoy = new Date();
	const [semanaReferencia] = useState(() => inicioDeSemana(hoy));
	const [diaSeleccionado, setDiaSeleccionado] = useState(() => new Date());
	const diasSemana = diasDeSemana(semanaReferencia);

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

	if (!habitos.length && !isLoading) return null;

	return (
		<View className="mb-4 pb-4 border-b border-gray-100">
			<View className="flex-row gap-1 mb-3">
				{diasSemana.map((dia) => {
					const seleccionado = esMismaFecha(dia, diaSeleccionado);
					const esHoy = esMismaFecha(dia, hoy);
					return (
						<TouchableOpacity
							key={dia.toISOString()}
							onPress={() => setDiaSeleccionado(new Date(dia))}
							className={`flex-1 items-center py-1 rounded-md ${seleccionado ? "bg-slate-900" : esHoy ? "bg-slate-100" : ""}`}
						>
							<Text className={`text-[10px] ${seleccionado ? "text-white" : "text-gray-500"}`}>
								{nombreDiaCorto(dia)}
							</Text>
							<Text className={`text-xs font-medium ${seleccionado ? "text-white" : "text-slate-900"}`}>
								{dia.getDate()}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>

			{isLoading ? (
				<View className="py-2 items-center">
					<LoadingSpinner />
				</View>
			) : (
				habitos.map((habito) => (
					<HabitoCelda key={habito.clientId} habito={habito} onRegistrar={registrar} />
				))
			)}

			<TouchableOpacity onPress={onVerTodos} className="mt-2">
				<Text className="text-xs text-gray-400 text-right">Ver hábitos →</Text>
			</TouchableOpacity>
		</View>
	);
}

function HabitoCelda({
	habito,
	onRegistrar,
}: {
	habito: TrackerHabitoView;
	onRegistrar: (h: TrackerHabitoView, v: boolean | number) => void;
}) {
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
			<View className="flex-row items-center justify-between py-2 border-b border-gray-50">
				<Text className="text-sm text-slate-900 flex-1">{habito.nombre}</Text>
				<View className="flex-row items-center gap-1">
					<TextInput
						value={inputValor}
						onChangeText={setInputValor}
						onEndEditing={() => {
							const val = parseInt(inputValor, 10);
							if (!isNaN(val)) onRegistrar(habito, val);
						}}
						keyboardType="numeric"
						className="w-14 text-center border border-gray-200 rounded px-1 py-1 text-sm"
					/>
					{habito.metaMinutos && (
						<Text className="text-xs text-gray-400">/{habito.metaMinutos}</Text>
					)}
				</View>
			</View>
		);
	}

	return (
		<View className="flex-row items-center justify-between py-2 border-b border-gray-50">
			<Text className="text-sm text-slate-900 flex-1">{habito.nombre}</Text>
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
