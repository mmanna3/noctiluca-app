import { TipoListaObjetivoEnum } from "@/api/clients";
import {
	claveAnio,
	claveDia,
	claveLustro,
	clavePeriodoActual,
	claveSemana,
	esClaveSemanaFutura,
	esDiaFuturo,
	etiquetaDiaRelativo,
	etiquetaPeriodo,
	etiquetaSemanaRelativa,
	fechaManana,
	fechaMinimaPlanificacion,
	fechaMinimaPlanificacionSemana,
	rangoSemanaDesdeClave,
	sumarDias,
	sumarSemanas,
} from "../objetivos";

const ref = new Date(2026, 6, 5); // 5 jul 2026

describe("etiquetaDiaRelativo", () => {
	test("devuelve Hoy, Mañana y Pasado mañana", () => {
		expect(etiquetaDiaRelativo(new Date(2026, 6, 5), ref)).toBe("Hoy");
		expect(etiquetaDiaRelativo(new Date(2026, 6, 6), ref)).toBe("Mañana");
		expect(etiquetaDiaRelativo(new Date(2026, 6, 7), ref)).toBe("Pasado mañana");
	});

	test("devuelve fecha corta para días más lejanos", () => {
		const etiqueta = etiquetaDiaRelativo(new Date(2026, 6, 20), ref);
		expect(etiqueta).not.toBe("Hoy");
		expect(etiqueta).not.toBe("Mañana");
		expect(etiqueta).toMatch(/20/);
	});
});

describe("helpers de planificación", () => {
	test("fechaMinimaPlanificacion es mañana", () => {
		expect(fechaMinimaPlanificacion(ref).getTime()).toBe(fechaManana(ref).getTime());
	});

	test("claveDia formatea YYYY-MM-DD", () => {
		expect(claveDia(new Date(2026, 6, 15))).toBe("2026-07-15");
	});

	test("esDiaFuturo distingue hoy y mañana", () => {
		expect(esDiaFuturo(new Date(2026, 6, 5), ref)).toBe(false);
		expect(esDiaFuturo(new Date(2026, 6, 6), ref)).toBe(true);
	});
});

describe("claves de año y lustro", () => {
	test("claveAnio es el año en YYYY", () => {
		expect(claveAnio(new Date(2026, 5, 15))).toBe("2026");
	});

	test("claveLustro ancla en bloques fijos de múltiplos de 5", () => {
		expect(claveLustro(new Date(2025, 0, 1))).toBe("2025-2029");
		expect(claveLustro(new Date(2026, 5, 15))).toBe("2025-2029");
		expect(claveLustro(new Date(2029, 11, 31))).toBe("2025-2029");
		expect(claveLustro(new Date(2030, 0, 1))).toBe("2030-2034");
		expect(claveLustro(new Date(2024, 5, 1))).toBe("2020-2024");
	});

	test("clavePeriodoActual soporta año y lustro", () => {
		expect(clavePeriodoActual(TipoListaObjetivoEnum._4, ref)).toBe("2026");
		expect(clavePeriodoActual(TipoListaObjetivoEnum._5, ref)).toBe("2025-2029");
	});

	test("etiquetaPeriodo soporta año y lustro", () => {
		expect(etiquetaPeriodo(TipoListaObjetivoEnum._4, "2026")).toBe("2026");
		expect(etiquetaPeriodo(TipoListaObjetivoEnum._5, "2025-2029")).toBe("2025–2029");
	});
});

describe("semanas", () => {
	const lunesYDomingo = (r: { inicio: Date; fin: Date }) => [claveDia(r.inicio), claveDia(r.fin)];

	test("claveSemana usa año y semana ISO, también en los bordes de año", () => {
		expect(claveSemana(new Date(2026, 9, 19))).toBe("2026-W43");
		expect(claveSemana(new Date(2026, 11, 31))).toBe("2026-W53");
		expect(claveSemana(new Date(2027, 0, 3))).toBe("2026-W53");
		expect(claveSemana(new Date(2027, 0, 4))).toBe("2027-W01");
		expect(claveSemana(new Date(2024, 11, 30))).toBe("2025-W01");
	});

	test("rangoSemanaDesdeClave devuelve lunes y domingo", () => {
		expect(lunesYDomingo(rangoSemanaDesdeClave("2026-W43"))).toEqual(["2026-10-19", "2026-10-25"]);
		expect(lunesYDomingo(rangoSemanaDesdeClave("2026-W53"))).toEqual(["2026-12-28", "2027-01-03"]);
		expect(lunesYDomingo(rangoSemanaDesdeClave("2025-W01"))).toEqual(["2024-12-30", "2025-01-05"]);
		expect(lunesYDomingo(rangoSemanaDesdeClave("2027-W01"))).toEqual(["2027-01-04", "2027-01-10"]);
	});

	test("rangoSemanaDesdeClave es el inverso de claveSemana", () => {
		for (let i = 0; i < 400; i += 3) {
			const fecha = sumarDias(new Date(2025, 11, 1), i);
			const { inicio, fin } = rangoSemanaDesdeClave(claveSemana(fecha));
			expect(inicio.getDay()).toBe(1);
			expect(fecha.getTime()).toBeGreaterThanOrEqual(inicio.getTime());
			expect(fecha.getTime()).toBeLessThanOrEqual(fin.getTime());
		}
	});

	test("sumarSemanas devuelve el lunes de la semana desplazada", () => {
		const miercoles = new Date(2026, 9, 21);
		expect(claveDia(sumarSemanas(miercoles, 0))).toBe("2026-10-19");
		expect(claveDia(sumarSemanas(miercoles, 1))).toBe("2026-10-26");
		expect(claveDia(sumarSemanas(miercoles, -1))).toBe("2026-10-12");
		expect(claveSemana(sumarSemanas(new Date(2026, 11, 30), 1))).toBe("2027-W01");
	});

	test("la planificación arranca el lunes de la semana siguiente", () => {
		expect(claveDia(fechaMinimaPlanificacionSemana(new Date(2026, 9, 25)))).toBe("2026-10-26");
		expect(claveDia(fechaMinimaPlanificacionSemana(new Date(2026, 9, 19)))).toBe("2026-10-26");
	});

	test("esClaveSemanaFutura excluye la semana actual y las pasadas", () => {
		const domingo = new Date(2026, 9, 25);
		expect(esClaveSemanaFutura("2026-W43", domingo)).toBe(false);
		expect(esClaveSemanaFutura("2026-W42", domingo)).toBe(false);
		expect(esClaveSemanaFutura("2026-W44", domingo)).toBe(true);
		expect(esClaveSemanaFutura("2027-W01", domingo)).toBe(true);
	});

	test("etiquetaSemanaRelativa", () => {
		const r = new Date(2026, 9, 21);
		expect(etiquetaSemanaRelativa(new Date(2026, 9, 25), r)).toBe("Esta semana");
		expect(etiquetaSemanaRelativa(new Date(2026, 9, 26), r)).toBe("Próxima semana");
		expect(etiquetaSemanaRelativa(new Date(2026, 10, 4), r)).toBe("En 2 semanas");
		expect(etiquetaSemanaRelativa(new Date(2027, 0, 4), r)).toBe("En 11 semanas");
		expect(etiquetaSemanaRelativa(new Date(2026, 9, 12), r)).toMatch(/^12 .*–18 /);
	});

	test("etiquetaPeriodo calcula el rango de la semana si la lista no trae fechas", () => {
		const etiqueta = etiquetaPeriodo(TipoListaObjetivoEnum._2, "2026-W44");
		expect(etiqueta).toMatch(/^Semana 44 · 26 .*–1 /);
	});
});
