import { PropositoCarpetaEnum, TipoListaObjetivoEnum } from "@/api/clients";
import { finDeSemana, formatearFechaClave, inicioDeSemana } from "./habitos";

export const LIMITE_RECOMENDADO_DIA = 7;

export const propositoATipo = (
	proposito?: PropositoCarpetaEnum,
): TipoListaObjetivoEnum | undefined => {
	switch (proposito) {
	case PropositoCarpetaEnum._2:
		return TipoListaObjetivoEnum._1;
	case PropositoCarpetaEnum._3:
		return TipoListaObjetivoEnum._2;
	case PropositoCarpetaEnum._4:
		return TipoListaObjetivoEnum._3;
	default:
		return undefined;
	}
};

export const esCarpetaObjetivos = (proposito?: PropositoCarpetaEnum): boolean =>
	proposito !== undefined && proposito >= PropositoCarpetaEnum._1;

export const claveSemana = (fecha: Date): string => {
	const year = obtenerAnioIso(fecha);
	const week = obtenerSemanaIso(fecha);
	return `${year}-W${String(week).padStart(2, "0")}`;
};

export const claveMes = (fecha: Date): string => {
	const year = fecha.getFullYear();
	const month = String(fecha.getMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
};

export const clavePeriodoActual = (tipo: TipoListaObjetivoEnum, fecha = new Date()): string => {
	switch (tipo) {
	case TipoListaObjetivoEnum._1:
		return formatearFechaClave(fecha);
	case TipoListaObjetivoEnum._2:
		return claveSemana(fecha);
	case TipoListaObjetivoEnum._3:
		return claveMes(fecha);
	default:
		return formatearFechaClave(fecha);
	}
};

export const etiquetaPeriodo = (
	tipo: TipoListaObjetivoEnum,
	clavePeriodo: string,
	fechaInicio?: Date,
	fechaFin?: Date,
): string => {
	switch (tipo) {
	case TipoListaObjetivoEnum._1:
		return formatearDiaCorto(parsearClaveDia(clavePeriodo));
	case TipoListaObjetivoEnum._2:
		return etiquetaSemana(clavePeriodo, fechaInicio, fechaFin);
	case TipoListaObjetivoEnum._3:
		return etiquetaMes(clavePeriodo);
	default:
		return clavePeriodo;
	}
};

const formatearDiaCorto = (fecha: Date): string =>
	fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short" });

const etiquetaSemana = (clave: string, inicio?: Date, fin?: Date): string => {
	const partes = clave.split("-W");
	const numero = partes[1] ?? "";
	if (inicio && fin) {
		const fmt = (f: Date) =>
			f.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
		return `Semana ${numero} · ${fmt(inicio)}–${fmt(fin)}`;
	}
	return `Semana ${numero}`;
};

const etiquetaMes = (clave: string): string => {
	const [year, month] = clave.split("-");
	const fecha = new Date(Number(year), Number(month) - 1, 1);
	return fecha.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
};

export const parsearClaveDia = (clave: string): Date => {
	const [year, month, day] = clave.split("-").map(Number);
	return new Date(year, month - 1, day);
};

export const inicioDeDiaLocal = (fecha: Date): Date =>
	new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

export const sumarDias = (fecha: Date, dias: number): Date => {
	const copia = inicioDeDiaLocal(fecha);
	copia.setDate(copia.getDate() + dias);
	return copia;
};

export const fechaManana = (referencia = new Date()): Date => sumarDias(referencia, 1);

export const claveManana = (referencia = new Date()): string =>
	clavePeriodoActual(TipoListaObjetivoEnum._1, fechaManana(referencia));

export const claveDia = (fecha: Date): string =>
	clavePeriodoActual(TipoListaObjetivoEnum._1, fecha);

export const fechaMinimaPlanificacion = (referencia = new Date()): Date =>
	fechaManana(referencia);

export const esDiaFuturo = (fecha: Date, referencia = new Date()): boolean =>
	inicioDeDiaLocal(fecha).getTime() > inicioDeDiaLocal(referencia).getTime();

export const etiquetaDiaRelativo = (fecha: Date, referencia = new Date()): string => {
	const dia = inicioDeDiaLocal(fecha);
	const ref = inicioDeDiaLocal(referencia);
	const diffDias = Math.round((dia.getTime() - ref.getTime()) / 86400000);
	if (diffDias === 0) return "Hoy";
	if (diffDias === 1) return "Mañana";
	if (diffDias === 2) return "Pasado mañana";
	return formatearDiaCorto(dia);
};

export const esClaveDiaFutura = (clavePeriodo: string, referencia = new Date()): boolean => {
	const dia = parsearClaveDia(clavePeriodo);
	return dia.getTime() > inicioDeDiaLocal(referencia).getTime();
};

export const rangoSemanaActual = (fecha = new Date()) => ({
	inicio: inicioDeSemana(fecha),
	fin: finDeSemana(fecha),
});

const obtenerSemanaIso = (fecha: Date): number => {
	const copia = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
	const dia = copia.getUTCDay() || 7;
	copia.setUTCDate(copia.getUTCDate() + 4 - dia);
	const inicioAnio = new Date(Date.UTC(copia.getUTCFullYear(), 0, 1));
	return Math.ceil(((copia.getTime() - inicioAnio.getTime()) / 86400000 + 1) / 7);
};

const obtenerAnioIso = (fecha: Date): number => {
	const copia = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
	const dia = copia.getUTCDay() || 7;
	copia.setUTCDate(copia.getUTCDate() + 4 - dia);
	return copia.getUTCFullYear();
};

export const tituloPeriodoActual = (tipo: TipoListaObjetivoEnum): string => {
	switch (tipo) {
	case TipoListaObjetivoEnum._1:
		return "Hoy";
	case TipoListaObjetivoEnum._2:
		return "Esta semana";
	case TipoListaObjetivoEnum._3:
		return "Este mes";
	default:
		return "Objetivos";
	}
};
