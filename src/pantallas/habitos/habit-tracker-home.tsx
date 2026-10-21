import { TipoHabitoEnum } from "@/api/clients";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import MarcadorSiNo from "@/components/ui/marcador-si-no";
import { estadoDeRegistro } from "@/sync/habitos-core";
import { useSinMarcarPorDia, useTrackerDia } from "@/sync/lecturas";
import { TrackerHabitoView } from "@/sync/lecturas-core";
import { guardarRegistroHabitoLocal } from "@/sync/repositorio-habitos";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "@/components/ui/texto";
import { Ionicons } from "@expo/vector-icons";
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
	const sinMarcarPorDia = useSinMarcarPorDia(diasSemana);
	const isLoading = data === undefined;
	const habitos = data ?? [];
	const seleccionadoEsFuturo = diaSeleccionado.getTime() > finDelDia(hoy);
	const faltan = habitos.filter((h) => estadoDeRegistro(h, h) === "sin_marcar").length;

	/** `null` desmarca el día (vuelve a "sin marcar"). */
	const registrar = (habito: TrackerHabitoView, valor: boolean | number | null) => {
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
				{diasSemana.map((dia, i) => {
					const seleccionado = esMismaFecha(dia, diaSeleccionado);
					const esHoy = esMismaFecha(dia, hoy);
					const pendiente = dia.getTime() <= finDelDia(hoy) && (sinMarcarPorDia?.[i] ?? 0) > 0;
					return (
						<TouchableOpacity
							key={dia.toISOString()}
							onPress={() => setDiaSeleccionado(new Date(dia))}
							accessibilityLabel={pendiente ? `${nombreDiaCorto(dia)} ${dia.getDate()}, con hábitos sin marcar` : undefined}
							className={`flex-1 items-center py-1 rounded-md ${seleccionado ? "bg-slate-900" : esHoy ? "bg-slate-100" : ""}`}
						>
							<Text className={`text-[10px] web:text-xs ${seleccionado ? "text-white" : "text-gray-500"}`}>
								{nombreDiaCorto(dia)}
							</Text>
							<Text className={`text-xs font-medium ${seleccionado ? "text-white" : "text-slate-900"}`}>
								{dia.getDate()}
							</Text>
							<View
								testID={pendiente ? "dia-pendiente" : undefined}
								className={`h-1 w-1 mt-0.5 rounded-full ${pendiente ? "bg-amber-500" : "bg-transparent"}`}
							/>
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
					<HabitoCelda
						key={habito.clientId}
						habito={habito}
						mostrarPendiente={!seleccionadoEsFuturo}
						onRegistrar={registrar}
					/>
				))
			)}

			<View className="flex-row justify-between items-center mt-2">
				<Text className="text-xs text-amber-600">
					{!isLoading && !seleccionadoEsFuturo && faltan > 0
						? `Falta${faltan === 1 ? "" : "n"} ${faltan} por marcar`
						: ""}
				</Text>
				<TouchableOpacity onPress={onVerTodos}>
					<Text className="text-xs text-gray-400 text-right">Ver hábitos →</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const finDelDia = (fecha: Date): number =>
	new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999).getTime();

function HabitoCelda({
	habito,
	mostrarPendiente,
	onRegistrar,
}: {
	habito: TrackerHabitoView;
	mostrarPendiente: boolean;
	onRegistrar: (h: TrackerHabitoView, v: boolean | number | null) => void;
}) {
	const esNumerico = habito.tipo === TipoHabitoEnum._2;
	const [valorBooleano, setValorBooleano] = useState(habito.valorBooleano);
	const [inputValor, setInputValor] = useState(
		habito.valorNumerico != null ? String(habito.valorNumerico) : "",
	);

	useEffect(() => {
		setValorBooleano(habito.valorBooleano);
	}, [habito.valorBooleano]);

	useEffect(() => {
		setInputValor(habito.valorNumerico != null ? String(habito.valorNumerico) : "");
	}, [habito.valorNumerico]);

	const sinMarcar = esNumerico ? habito.valorNumerico == null : valorBooleano == null;

	const nombre = (
		<View className="flex-row items-center flex-1 gap-2">
			<View
				className={`h-1.5 w-1.5 rounded-full ${mostrarPendiente && sinMarcar ? "bg-amber-500" : "bg-transparent"}`}
			/>
			<Text className={`text-sm flex-1 ${sinMarcar ? "text-slate-900" : "text-slate-500"}`}>{habito.nombre}</Text>
		</View>
	);

	if (esNumerico) {
		const guardarInput = () => {
			const texto = inputValor.trim();
			if (texto === "") {
				if (habito.valorNumerico != null) onRegistrar(habito, null);
				return;
			}
			const val = parseInt(texto, 10);
			if (!isNaN(val) && val >= 0 && val !== habito.valorNumerico) onRegistrar(habito, val);
		};
		const enCero = habito.valorNumerico === 0;
		return (
			<View className="flex-row items-center justify-between py-2 border-b border-gray-50">
				{nombre}
				<View className="flex-row items-center gap-2">
					<TouchableOpacity
						onPress={() => onRegistrar(habito, enCero ? null : 0)}
						accessibilityRole="radio"
						accessibilityState={{ checked: enCero }}
						accessibilityLabel={`${habito.nombre}: no lo hice`}
						className={`h-7 w-7 rounded-full border items-center justify-center ${
							enCero ? "bg-rose-100 border-rose-400" : "border-gray-300 hover:bg-rose-50"
						}`}
					>
						<Ionicons name="close" size={16} color={enCero ? "#be123c" : "#9ca3af"} />
					</TouchableOpacity>
					<View className="flex-row items-center gap-1">
						<TextInput
							value={inputValor}
							onChangeText={setInputValor}
							onBlur={guardarInput}
							placeholder="—"
							accessibilityLabel={`${habito.nombre}: minutos`}
							keyboardType="numeric"
							className="w-14 text-center border border-gray-200 rounded px-1 py-1 text-sm"
						/>
						{habito.metaMinutos && (
							<Text className="text-xs text-gray-400">/{habito.metaMinutos}</Text>
						)}
					</View>
				</View>
			</View>
		);
	}

	return (
		<View className="flex-row items-center justify-between py-2 border-b border-gray-50">
			{nombre}
			<MarcadorSiNo
				valor={valorBooleano}
				nombre={habito.nombre}
				onCambiar={(valor) => {
					setValorBooleano(valor ?? undefined);
					onRegistrar(habito, valor);
				}}
			/>
		</View>
	);
}
