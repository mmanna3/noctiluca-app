import { api } from "@/api/api";
import { HabitoTrackerItemDTO, TipoHabitoEnum, UpsertRegistroHabitoDTO } from "@/api/clients";
import { queryKeys } from "@/api/query-keys";
import useApiQuery from "@/api/custom-hooks/use-api-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PuntoMarcador from "@/components/ui/punto-marcador";
import { fechaCalendarioLocal } from "@/sync/fechas";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { diasDeSemana, esMismaFecha, inicioDeSemana, nombreDiaCorto } from "./utilidades-habitos";

interface Props {
	onVerTodos: () => void;
}

export default function HabitTrackerHome({ onVerTodos }: Props) {
	const hoy = new Date();
	const [semanaReferencia] = useState(() => inicioDeSemana(hoy));
	const [diaSeleccionado, setDiaSeleccionado] = useState(() => new Date());
	const diasSemana = diasDeSemana(semanaReferencia);

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
					<HabitoCelda key={String(habito.id)} habito={habito} onRegistrar={registrar} />
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
	habito: HabitoTrackerItemDTO;
	onRegistrar: (h: HabitoTrackerItemDTO, v: boolean | number) => Promise<void>;
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
							if (!isNaN(val)) void onRegistrar(habito, val);
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
					void onRegistrar(habito, !marcado);
				}}
			/>
		</View>
	);
}
