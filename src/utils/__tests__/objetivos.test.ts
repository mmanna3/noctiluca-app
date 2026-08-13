import {
	claveDia,
	esDiaFuturo,
	etiquetaDiaRelativo,
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
