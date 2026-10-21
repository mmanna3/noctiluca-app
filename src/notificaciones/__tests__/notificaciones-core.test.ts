import { HabitoLocal, RegistroHabitoLocal } from "@/sync/tipos";
import { DIAS_AGENDADOS, recordatoriosPendientes } from "../notificaciones-core";

const habitos: HabitoLocal[] = [
	{ clientId: "a", nombre: "meditar", tipo: 1, activo: true, posicion: 0, version: 1 },
	{ clientId: "b", nombre: "leer", tipo: 2, activo: true, posicion: 1, version: 1, metaMinutos: 30 },
];

const registro = (habitoClientId: string, fecha: string, v: Partial<RegistroHabitoLocal>): RegistroHabitoLocal => ({
	clientId: `${habitoClientId}-${fecha}`,
	habitoClientId,
	fecha,
	version: 1,
	...v,
});

describe("recordatoriosPendientes", () => {
	const ahora = new Date(2026, 9, 21, 10, 0);

	it("agenda uno por día a las 23:59 desde hoy, con la cantidad que falta", () => {
		const r = recordatoriosPendientes(habitos, [registro("a", "2026-10-21", { valorBooleano: true })], ahora);
		expect(r).toHaveLength(DIAS_AGENDADOS);
		expect(r[0].id).toBe("pendientes-2026-10-21");
		expect(r[0].fecha).toEqual(new Date(2026, 9, 21, 23, 59));
		expect(r[0].cuerpo).toContain("1 hábito");
		expect(r[1].id).toBe("pendientes-2026-10-22");
		expect(r[1].cuerpo).toContain("2 hábitos");
	});

	it("no agenda el día de hoy si todo está marcado, aunque sea con 'no'", () => {
		const r = recordatoriosPendientes(
			habitos,
			[
				registro("a", "2026-10-21", { valorBooleano: false }),
				registro("b", "2026-10-21", { valorNumerico: 0 }),
			],
			ahora,
		);
		expect(r.map((x) => x.id)).not.toContain("pendientes-2026-10-21");
		expect(r[0].id).toBe("pendientes-2026-10-22");
	});

	it("si se desmarca un hábito, vuelve a agendar el de hoy", () => {
		const r = recordatoriosPendientes(
			habitos,
			[registro("a", "2026-10-21", { valorBooleano: true }), registro("b", "2026-10-21", {})],
			ahora,
		);
		expect(r[0].id).toBe("pendientes-2026-10-21");
	});

	it("pasadas las 23:59 arranca por mañana", () => {
		const r = recordatoriosPendientes(habitos, [], new Date(2026, 9, 21, 23, 59, 30));
		expect(r[0].id).toBe("pendientes-2026-10-22");
	});

	it("sin hábitos activos no agenda nada", () => {
		expect(recordatoriosPendientes([{ ...habitos[0], activo: false }], [], ahora)).toEqual([]);
	});
});
