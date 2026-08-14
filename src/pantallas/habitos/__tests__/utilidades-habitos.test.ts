import {
	diasDeSemana,
	esMismaFecha,
	esHabitoNumerico,
	esHabitoSiNo,
	formatearFechaClave,
	inicioDeSemana,
	MAX_HABITOS_ACTIVOS,
	nombreDiaCorto,
} from "../utilidades-habitos";

const LUNES = new Date(2026, 6, 6); // 6 jul 2026 (lunes)
const MIERCOLES = new Date(2026, 6, 8); // 8 jul 2026 (miércoles)
const DOMINGO = new Date(2026, 6, 12); // 12 jul 2026 (domingo)

describe("inicioDeSemana", () => {
	it("devuelve el lunes de la misma semana", () => {
		const inicio = inicioDeSemana(MIERCOLES);
		expect(inicio.getDay()).toBe(1);
		expect(inicio.getDate()).toBe(6);
	});

	it("para un lunes devuelve el mismo día", () => {
		const inicio = inicioDeSemana(LUNES);
		expect(inicio.getDate()).toBe(6);
	});

	it("para un domingo devuelve el lunes anterior", () => {
		const inicio = inicioDeSemana(DOMINGO);
		expect(inicio.getDate()).toBe(6);
	});

	it("normaliza la hora a 00:00:00", () => {
		const inicio = inicioDeSemana(MIERCOLES);
		expect(inicio.getHours()).toBe(0);
		expect(inicio.getMinutes()).toBe(0);
	});
});

describe("diasDeSemana", () => {
	it("devuelve 7 días comenzando en lunes", () => {
		const dias = diasDeSemana(MIERCOLES);
		expect(dias).toHaveLength(7);
		expect(dias[0].getDay()).toBe(1);
		expect(dias[6].getDay()).toBe(0);
	});

	it("los días son consecutivos", () => {
		const dias = diasDeSemana(MIERCOLES);
		for (let i = 1; i < dias.length; i++) {
			const diff = dias[i].getTime() - dias[i - 1].getTime();
			expect(diff).toBe(86400000);
		}
	});
});

describe("esMismaFecha", () => {
	it("devuelve true para el mismo día", () => {
		expect(esMismaFecha(new Date(2026, 6, 6, 10, 0), new Date(2026, 6, 6, 22, 0))).toBe(true);
	});

	it("devuelve false para días distintos", () => {
		expect(esMismaFecha(new Date(2026, 6, 6), new Date(2026, 6, 7))).toBe(false);
	});
});

describe("nombreDiaCorto", () => {
	it("devuelve 'Lun' para lunes", () => {
		expect(nombreDiaCorto(LUNES)).toBe("Lun");
	});

	it("devuelve 'Dom' para domingo", () => {
		expect(nombreDiaCorto(DOMINGO)).toBe("Dom");
	});

	it("devuelve 'Mié' para miércoles", () => {
		expect(nombreDiaCorto(MIERCOLES)).toBe("Mié");
	});
});

describe("esHabitoNumerico / esHabitoSiNo", () => {
	it("tipo 2 es numérico", () => {
		expect(esHabitoNumerico(2)).toBe(true);
		expect(esHabitoSiNo(2)).toBe(false);
	});

	it("tipo 1 es sí/no", () => {
		expect(esHabitoSiNo(1)).toBe(true);
		expect(esHabitoNumerico(1)).toBe(false);
	});

	it("undefined devuelve false en ambos", () => {
		expect(esHabitoNumerico(undefined)).toBe(false);
		expect(esHabitoSiNo(undefined)).toBe(false);
	});
});

describe("formatearFechaClave", () => {
	it("formatea en YYYY-MM-DD", () => {
		const clave = formatearFechaClave(new Date(2026, 0, 5));
		expect(clave).toBe("2026-01-05");
	});
});

describe("MAX_HABITOS_ACTIVOS", () => {
	it("es 5", () => {
		expect(MAX_HABITOS_ACTIVOS).toBe(5);
	});
});
