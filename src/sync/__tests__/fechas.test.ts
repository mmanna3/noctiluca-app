import {
	fechaCalendarioDesdeApi,
	fechaCalendarioLocal,
	fechaClave,
	parsearFechaClave,
} from "../fechas";

describe("fechaClave", () => {
	test("usa el día calendario local", () => {
		const fecha = new Date(2026, 6, 1, 21, 0, 0);
		expect(fechaClave(fecha)).toBe("2026-07-01");
	});
});

describe("fechaCalendarioLocal", () => {
	test("no adelanta el día a las 21:00 GMT-3 al serializar para la API", () => {
		const fecha = new Date(2026, 6, 1, 21, 0, 0);
		expect(fechaCalendarioLocal(fecha).toISOString()).toBe("2026-07-01T12:00:00.000Z");
	});
});

describe("fechaCalendarioDesdeApi", () => {
	test("lee el día calendario UTC del servidor", () => {
		const fecha = new Date("2026-07-01T00:00:00.000Z");
		expect(fechaCalendarioDesdeApi(fecha)).toBe("2026-07-01");
	});
});

describe("parsearFechaClave", () => {
	test("reconstruye medianoche local", () => {
		const fecha = parsearFechaClave("2026-07-01");
		expect(fecha.getFullYear()).toBe(2026);
		expect(fecha.getMonth()).toBe(6);
		expect(fecha.getDate()).toBe(1);
	});
});
