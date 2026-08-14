import {
	convertirEnKey,
	diasDeSemana,
	esHabitoNumerico,
	esHabitoSiNo,
	fechaEsDeHaceMenosDe5Minutos,
	finDeSemana,
	generarKeyAPartirDeFecha,
	inicioDeSemana,
	MAX_HABITOS_ACTIVOS,
} from "../habitos";

const LUNES = new Date(2026, 6, 6);
const SABADO = new Date(2026, 6, 11);
const DOMINGO = new Date(2026, 6, 12);

describe("inicioDeSemana / finDeSemana", () => {
	it("inicio es lunes", () => {
		expect(inicioDeSemana(SABADO).getDay()).toBe(1);
		expect(inicioDeSemana(SABADO).getDate()).toBe(6);
	});

	it("fin es domingo", () => {
		expect(finDeSemana(LUNES).getDay()).toBe(0);
		expect(finDeSemana(LUNES).getDate()).toBe(12);
	});

	it("inicio de la semana del domingo apunta al lunes anterior", () => {
		expect(inicioDeSemana(DOMINGO).getDate()).toBe(6);
	});
});

describe("diasDeSemana", () => {
	it("devuelve 7 días de lunes a domingo", () => {
		const dias = diasDeSemana(SABADO);
		expect(dias).toHaveLength(7);
		expect(dias[0].getDay()).toBe(1);
		expect(dias[6].getDay()).toBe(0);
	});
});

describe("esHabitoNumerico / esHabitoSiNo", () => {
	it("tipo 1 es sí/no", () => {
		expect(esHabitoSiNo(1)).toBe(true);
		expect(esHabitoNumerico(1)).toBe(false);
	});

	it("tipo 2 es numérico", () => {
		expect(esHabitoNumerico(2)).toBe(true);
		expect(esHabitoSiNo(2)).toBe(false);
	});
});

describe("generarKeyAPartirDeFecha", () => {
	it("devuelve sólo dígitos sin los últimos 3", () => {
		const fecha = new Date("2026-07-06T12:00:00.000Z");
		const key = generarKeyAPartirDeFecha(fecha);
		expect(/^\d+$/.test(key)).toBe(true);
		expect(key.length).toBeGreaterThan(0);
	});
});

describe("convertirEnKey", () => {
	it("convierte espacios a guiones bajos y minúsculas", () => {
		expect(convertirEnKey("Hola Mundo")).toBe("hola_mundo");
	});

	it("elimina caracteres especiales excepto letras y tildes", () => {
		expect(convertirEnKey("café!")).toBe("café");
	});
});

describe("fechaEsDeHaceMenosDe5Minutos", () => {
	it("devuelve true para fecha reciente", () => {
		expect(fechaEsDeHaceMenosDe5Minutos(new Date())).toBe(true);
	});

	it("devuelve false para fecha antigua", () => {
		const hace10Min = new Date(Date.now() - 10 * 60 * 1000);
		expect(fechaEsDeHaceMenosDe5Minutos(hace10Min)).toBe(false);
	});
});

describe("MAX_HABITOS_ACTIVOS", () => {
	it("es 5", () => {
		expect(MAX_HABITOS_ACTIVOS).toBe(5);
	});
});
