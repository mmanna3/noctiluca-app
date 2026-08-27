import { PropositoCarpetaEnum, TipoListaObjetivoEnum } from "@/api/clients";
import Cuerpo from "@/components/ui/cuerpo";
import PantallaObjetivos from "@/pantallas/objetivos/pantalla-objetivos";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type PeriodoObjetivo = "hoy" | "semana" | "mes" | "anio" | "5-anios";

interface OpcionPeriodo {
	clave: PeriodoObjetivo;
	etiqueta: string;
}

const anioActual = new Date().getFullYear();

const PERIODOS: OpcionPeriodo[] = [
	{ clave: "hoy", etiqueta: "Hoy" },
	{ clave: "semana", etiqueta: "Semana" },
	{ clave: "mes", etiqueta: "Mes" },
	{ clave: "anio", etiqueta: String(anioActual) },
	{ clave: "5-anios", etiqueta: "5 años" },
];

/**
 * Tab "objetivos": funciona como una mini-app aparte, con su propia
 * navegación por período arriba (reemplaza la top-bar de "/" + lupa + "+").
 * Por ahora solo "hoy" y "semana" tienen contenido; el resto son a futuro
 * (requieren cambios de backend).
 */
export default function ObjetivosTab() {
	const [periodo, setPeriodo] = useState<PeriodoObjetivo>("hoy");

	return (
		<View className="flex-1">
			<View className="flex-row justify-between w-full pt-1">
				{PERIODOS.map((opcion) => {
					const seleccionado = periodo === opcion.clave;
					return (
						<TouchableOpacity
							key={opcion.clave}
							onPress={() => setPeriodo(opcion.clave)}
							className={`px-2.5 py-1.5 rounded-full ${seleccionado ? "bg-slate-900" : ""}`}
						>
							<Text className={`text-sm font-medium ${seleccionado ? "text-white" : "text-gray-500"}`}>
								{opcion.etiqueta}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
			<Cuerpo className="flex-1">
				{periodo === "hoy" && (
					<PantallaObjetivos tipo={TipoListaObjetivoEnum._1} proposito={PropositoCarpetaEnum._2} />
				)}
				{periodo === "semana" && (
					<PantallaObjetivos tipo={TipoListaObjetivoEnum._2} proposito={PropositoCarpetaEnum._3} />
				)}
				{(periodo === "mes" || periodo === "anio" || periodo === "5-anios") && (
					<View className="flex-1 items-center pt-10">
						<Text className="text-sm text-gray-400">Próximamente</Text>
					</View>
				)}
			</Cuerpo>
		</View>
	);
}
