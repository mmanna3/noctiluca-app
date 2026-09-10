import { TipoListaObjetivoEnum } from "@/api/clients";
import Cuerpo from "@/components/ui/cuerpo";
import PantallaObjetivos from "@/pantallas/objetivos/pantalla-objetivos";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type PeriodoObjetivo = "hoy" | "semana" | "mes" | "anio" | "lustro";

interface OpcionPeriodo {
	clave: PeriodoObjetivo;
	etiqueta: string;
	tipo: TipoListaObjetivoEnum;
}

const anioActual = new Date().getFullYear();

const PERIODOS: OpcionPeriodo[] = [
	{ clave: "hoy", etiqueta: "Hoy", tipo: TipoListaObjetivoEnum._1 },
	{ clave: "semana", etiqueta: "Semana", tipo: TipoListaObjetivoEnum._2 },
	{ clave: "mes", etiqueta: "Mes", tipo: TipoListaObjetivoEnum._3 },
	{ clave: "anio", etiqueta: String(anioActual), tipo: TipoListaObjetivoEnum._4 },
	{ clave: "lustro", etiqueta: "5 años", tipo: TipoListaObjetivoEnum._5 },
];

const esPeriodoValido = (v: string | undefined): v is PeriodoObjetivo =>
	v !== undefined && PERIODOS.some((o) => o.clave === v);

/**
 * Tab "objetivos": funciona como una mini-app aparte, con su propia
 * navegación por período arriba (reemplaza la top-bar de "/" + lupa + "+").
 */
export default function ObjetivosTab() {
	// `periodo` puede venir de un deep link de los widgets de iOS
	// (`noctiluca:///objetivos?periodo=semana`), si no arranca en "hoy".
	const { periodo: periodoParam } = useLocalSearchParams<{ periodo?: string }>();
	const [periodo, setPeriodo] = useState<PeriodoObjetivo>(
		esPeriodoValido(periodoParam) ? periodoParam : "hoy",
	);

	useEffect(() => {
		if (esPeriodoValido(periodoParam)) setPeriodo(periodoParam);
	}, [periodoParam]);

	const opcionActual = PERIODOS.find((o) => o.clave === periodo) ?? PERIODOS[0];

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
				<PantallaObjetivos key={opcionActual.clave} tipo={opcionActual.tipo} />
			</Cuerpo>
		</View>
	);
}
