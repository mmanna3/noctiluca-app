import { TipoListaObjetivoEnum } from "@/api/clients";
import { useDiasObjetivosFuturos } from "@/sync/lecturas";
import { claveDia, etiquetaDiaRelativo, fechaManana, fechaMinimaPlanificacion, sumarDias } from "@/utils/objetivos";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EditorListaObjetivos from "./editor-lista-objetivos";

/**
 * Permite planificar objetivos de días futuros (mañana en adelante), colapsado
 * por defecto. Puerto RN de `noctiluca-fe/src/pantallas/objetivos/planificacion-objetivos-dia.tsx`.
 */
export default function PlanificacionObjetivosDia() {
	const [abierto, setAbierto] = useState(false);
	const [diaSeleccionado, setDiaSeleccionado] = useState(() => fechaManana());

	const diasFuturos = useDiasObjetivosFuturos();
	const totalDiasPlanificados = diasFuturos?.length ?? 0;
	const tituloDia = etiquetaDiaRelativo(diaSeleccionado);
	const puedeRetroceder = diaSeleccionado.getTime() > fechaMinimaPlanificacion().getTime();

	const etiquetaToggle =
		totalDiasPlanificados > 0 ? `Planificar otro día · ${totalDiasPlanificados}` : "Planificar otro día";

	const irADiaAnterior = () => {
		const min = fechaMinimaPlanificacion();
		const nuevo = sumarDias(diaSeleccionado, -1);
		if (nuevo.getTime() < min.getTime()) return;
		setDiaSeleccionado(nuevo);
	};

	const irADiaSiguiente = () => setDiaSeleccionado(sumarDias(diaSeleccionado, 1));

	return (
		<View className="mb-4">
			<TouchableOpacity onPress={() => setAbierto((v) => !v)}>
				<Text className="text-sm text-gray-600 underline mb-2">
					{abierto ? "Ocultar planificación" : etiquetaToggle}
				</Text>
			</TouchableOpacity>

			{abierto && (
				<>
					<View className="flex-row items-center gap-2 mb-3">
						<TouchableOpacity
							onPress={() => setDiaSeleccionado(fechaManana())}
							className={`px-2 py-1 rounded-md ${
								claveDia(diaSeleccionado) === claveDia(fechaManana()) ? "bg-slate-900" : "bg-gray-100"
							}`}
						>
							<Text
								className={`text-xs ${
									claveDia(diaSeleccionado) === claveDia(fechaManana()) ? "text-white" : "text-gray-700"
								}`}
							>
								Mañana
							</Text>
						</TouchableOpacity>

						<TouchableOpacity onPress={irADiaAnterior} disabled={!puedeRetroceder} className="p-1" style={{ opacity: puedeRetroceder ? 1 : 0.3 }}>
							<Ionicons name="chevron-back" size={18} color="#0f172a" />
						</TouchableOpacity>
						<Text className="text-sm text-gray-700 min-w-[7rem] text-center">{tituloDia}</Text>
						<TouchableOpacity onPress={irADiaSiguiente} className="p-1">
							<Ionicons name="chevron-forward" size={18} color="#0f172a" />
						</TouchableOpacity>
					</View>

					<EditorListaObjetivos tipo={TipoListaObjetivoEnum._1} clavePeriodo={claveDia(diaSeleccionado)} />
				</>
			)}
		</View>
	);
}
