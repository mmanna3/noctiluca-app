import { TipoListaObjetivoEnum } from "@/api/clients";
import {
	claveAnio,
	claveDia,
	claveLustro,
	clavePeriodoActual,
	esDiaFuturo,
	etiquetaDiaRelativo,
	etiquetaPeriodo,
	fechaManana,
	fechaMinimaPlanificacion,
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
