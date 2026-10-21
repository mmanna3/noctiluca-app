import { cantidadSinMarcar, estadoDeRegistro, resumenSemanalDesde } from "../habitos-core";
import { HabitoLocal, RegistroHabitoLocal } from "../tipos";

const habito = (clientId: string, tipo = 1, extra: Partial<HabitoLocal> = {}): HabitoLocal => ({
	clientId,
	nombre: clientId,
	tipo,
	activo: true,
	posicion: 0,
	version: 1,
	...extra,
});

const registro = (
	habitoClientId: string,
	fecha: string,
	valores: Partial<RegistroHabitoLocal>,
): RegistroHabitoLocal => ({
	clientId: `${habitoClientId}-${fecha}`,
	habitoClientId,
	fecha,
	version: 1,
	...valores,
});

describe("estadoDeRegistro", () => {
	const siNo = habito("meditar");
	const minutos = habito("leer", 2, { metaMinutos: 30 });

	it("sí/no: true cumplido, false no cumplido, null o sin registro sin marcar", () => {
		expect(estadoDeRegistro(siNo, { valorBooleano: true })).toBe("cumplido");
		expect(estadoDeRegistro(siNo, { valorBooleano: false })).toBe("no_cumplido");
		expect(estadoDeRegistro(siNo, {})).toBe("sin_marcar");
		expect(estadoDeRegistro(siNo, undefined)).toBe("sin_marcar");
	});

	it("numérico: 0 es 'no lo hice' y se distingue de sin registrar", () => {
		expect(estadoDeRegistro(minutos, { valorNumerico: 0 })).toBe("no_cumplido");
		expect(estadoDeRegistro(minutos, { valorNumerico: 29 })).toBe("no_cumplido");
		expect(estadoDeRegistro(minutos, { valorNumerico: 30 })).toBe("cumplido");
		expect(estadoDeRegistro(minutos, {})).toBe("sin_marcar");
	});

	it("numérico sin meta usa 1 minuto como meta (igual que el backend)", () => {
		expect(estadoDeRegistro(habito("x", 2), { valorNumerico: 1 })).toBe("cumplido");
	});
});

describe("cantidadSinMarcar", () => {
	const dia = new Date(2026, 9, 21);
	const habitos = [habito("a"), habito("b"), habito("c", 2), habito("inactivo", 1, { activo: false })];

	it("cuenta solo activos sin sí ni no ese día", () => {
		const registros = [
			registro("a", "2026-10-21", { valorBooleano: false }),
			registro("b", "2026-10-20", { valorBooleano: true }),
			registro("c", "2026-10-21", { valorNumerico: 0 }),
		];
		expect(cantidadSinMarcar(habitos, registros, dia)).toBe(1);
	});

	it("desmarcado (null) vuelve a contar como sin marcar", () => {
		const registros = [
			registro("a", "2026-10-21", { valorBooleano: true }),
			registro("b", "2026-10-21", {}),
			registro("c", "2026-10-21", { valorNumerico: 10 }),
		];
		expect(cantidadSinMarcar(habitos, registros, dia)).toBe(1);
	});

	it("con todo marcado da 0", () => {
		const registros = [
			registro("a", "2026-10-21", { valorBooleano: true }),
			registro("b", "2026-10-21", { valorBooleano: false }),
			registro("c", "2026-10-21", { valorNumerico: 5 }),
		];
		expect(cantidadSinMarcar(habitos, registros, dia)).toBe(0);
	});
});

describe("resumenSemanalDesde", () => {
	// Semana del lunes 19 al domingo 25 de octubre de 2026; hoy es miércoles 21.
	const hoy = new Date(2026, 9, 21, 15, 0);

	it("separa sí, no y sin marcar, y no cuenta los días futuros como sin marcar", () => {
		const [r] = resumenSemanalDesde(
			[habito("a")],
			[
				registro("a", "2026-10-19", { valorBooleano: true }),
				registro("a", "2026-10-20", { valorBooleano: false }),
			],
			hoy,
			hoy,
		);
		expect(r.diasCumplidos).toBe(1);
		expect(r.diasNoCumplidos).toBe(1);
		expect(r.diasSinMarcar).toBe(1); // miércoles
		expect(r.detallePorDia.map((d) => d.estado)).toEqual([
			"cumplido",
			"no_cumplido",
			"sin_marcar",
			"sin_marcar",
			"sin_marcar",
			"sin_marcar",
			"sin_marcar",
		]);
		expect(r.detallePorDia.map((d) => d.futuro)).toEqual([false, false, false, true, true, true, true]);
	});

	it("numérico: total y promedio sobre los días registrados, 0 incluido", () => {
		const [r] = resumenSemanalDesde(
			[habito("leer", 2, { metaMinutos: 20 })],
			[
				registro("leer", "2026-10-19", { valorNumerico: 30 }),
				registro("leer", "2026-10-20", { valorNumerico: 0 }),
			],
			new Date(2026, 9, 25),
			hoy,
		);
		expect(r.totalMinutos).toBe(30);
		expect(r.promedioMinutos).toBe(15);
		expect(r.diasCumplidos).toBe(1);
		expect(r.diasNoCumplidos).toBe(1);
	});

	it("ignora hábitos inactivos y respeta la posición", () => {
		const r = resumenSemanalDesde(
			[habito("b", 1, { posicion: 2 }), habito("a", 1, { posicion: 1 }), habito("x", 1, { activo: false })],
			[],
			hoy,
			hoy,
		);
		expect(r.map((h) => h.clientId)).toEqual(["a", "b"]);
	});
});
