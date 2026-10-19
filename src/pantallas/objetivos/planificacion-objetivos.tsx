import { TipoListaObjetivoEnum } from "@/api/clients";
import { useDiasObjetivosFuturos, useSemanasObjetivosFuturas } from "@/sync/lecturas";
import {
	claveDia,
	claveSemana,
	etiquetaDiaRelativo,
	etiquetaPeriodo,
	etiquetaSemanaRelativa,
	fechaMinimaPlanificacion,
	fechaMinimaPlanificacionSemana,
	sumarDias,
	sumarSemanas,
} from "@/utils/objetivos";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/texto";
import { Ionicons } from "@expo/vector-icons";
import EditorListaObjetivos from "./editor-lista-objetivos";

/** Lo que cambia entre planificar días y planificar semanas. */
interface ConfiguracionPlanificacion {
	textoToggle: string;
	etiquetaAtajo: string;
	fechaMinima: () => Date;
	/** Mueve la fecha `pasos` períodos (días o semanas). */
	mover: (fecha: Date, pasos: number) => Date;
	clave: (fecha: Date) => string;
	titulo: (fecha: Date) => string;
	/** Línea secundaria bajo el selector (p. ej. el rango de la semana). */
	detalle?: (fecha: Date) => string;
	usarCantidadPlanificados: () => number;
}

const CONFIGURACIONES: Partial<Record<TipoListaObjetivoEnum, ConfiguracionPlanificacion>> = {
	[TipoListaObjetivoEnum._1]: {
		textoToggle: "Planificar otro día",
		etiquetaAtajo: "Mañana",
		fechaMinima: () => fechaMinimaPlanificacion(),
		mover: sumarDias,
		clave: claveDia,
		titulo: (fecha) => etiquetaDiaRelativo(fecha),
		usarCantidadPlanificados: () => useDiasObjetivosFuturos()?.length ?? 0,
	},
	[TipoListaObjetivoEnum._2]: {
		textoToggle: "Planificar otra semana",
		etiquetaAtajo: "Próxima",
		fechaMinima: () => fechaMinimaPlanificacionSemana(),
		mover: sumarSemanas,
		clave: claveSemana,
		titulo: (fecha) => etiquetaSemanaRelativa(fecha),
		detalle: (fecha) => etiquetaPeriodo(TipoListaObjetivoEnum._2, claveSemana(fecha)),
		usarCantidadPlanificados: () => useSemanasObjetivosFuturas()?.length ?? 0,
	},
};

/** Los tipos de objetivo que se pueden planificar a futuro. */
export const sePuedePlanificar = (tipo: TipoListaObjetivoEnum): boolean => CONFIGURACIONES[tipo] !== undefined;

interface Props {
	tipo: TipoListaObjetivoEnum;
}

/**
 * Permite planificar objetivos de períodos futuros (días desde mañana, semanas
 * desde la próxima), colapsado por defecto. Montarlo con `key={tipo}`: la
 * configuración trae un hook y no puede cambiar durante la vida del componente.
 */
export default function PlanificacionObjetivos({ tipo }: Props) {
	const config = CONFIGURACIONES[tipo];
	if (!config) return null;
	return <SelectorPlanificacion tipo={tipo} config={config} />;
}

function SelectorPlanificacion({ tipo, config }: { tipo: TipoListaObjetivoEnum; config: ConfiguracionPlanificacion }) {
	const [abierto, setAbierto] = useState(false);
	const [seleccionada, setSeleccionada] = useState(() => config.fechaMinima());

	const totalPlanificados = config.usarCantidadPlanificados();
	const claveSeleccionada = config.clave(seleccionada);
	const esLaMinima = claveSeleccionada === config.clave(config.fechaMinima());
	const puedeRetroceder = seleccionada.getTime() > config.fechaMinima().getTime();

	const etiquetaToggle =
		totalPlanificados > 0 ? `${config.textoToggle} · ${totalPlanificados}` : config.textoToggle;

	const irAnterior = () => {
		const nueva = config.mover(seleccionada, -1);
		if (nueva.getTime() < config.fechaMinima().getTime()) return;
		setSeleccionada(nueva);
	};

	const irSiguiente = () => setSeleccionada(config.mover(seleccionada, 1));

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
							onPress={() => setSeleccionada(config.fechaMinima())}
							className={`px-2 py-1 rounded-md ${esLaMinima ? "bg-slate-900" : "bg-gray-100"}`}
						>
							<Text className={`text-xs ${esLaMinima ? "text-white" : "text-gray-700"}`}>
								{config.etiquetaAtajo}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity onPress={irAnterior} disabled={!puedeRetroceder} className="p-1" style={{ opacity: puedeRetroceder ? 1 : 0.3 }}>
							<Ionicons name="chevron-back" size={18} color="#0f172a" />
						</TouchableOpacity>
						<Text className="text-sm text-gray-700 min-w-[7rem] text-center">{config.titulo(seleccionada)}</Text>
						<TouchableOpacity onPress={irSiguiente} className="p-1">
							<Ionicons name="chevron-forward" size={18} color="#0f172a" />
						</TouchableOpacity>
					</View>
					{config.detalle && (
						<Text className="text-xs text-gray-500 -mt-1 mb-3">{config.detalle(seleccionada)}</Text>
					)}

					<EditorListaObjetivos tipo={tipo} clavePeriodo={claveSeleccionada} />
				</>
			)}
		</View>
	);
}
