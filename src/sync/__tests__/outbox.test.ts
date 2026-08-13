import { compactar } from "../outbox";
import { OperacionOutbox } from "../tipos";

const op = (over: Partial<OperacionOutbox>): OperacionOutbox => ({
	clientOpId: over.clientOpId ?? "op-" + Math.random(),
	entityType: over.entityType ?? "escrito",
	operation: over.operation ?? "upsert",
	clientEntityId: over.clientEntityId ?? "entidad-1",
	baseVersion: over.baseVersion,
	clientTimestamp: over.clientTimestamp ?? new Date().toISOString(),
	payload: over.payload ?? {},
	intentos: over.intentos ?? 0,
	muerta: over.muerta,
});

describe("compactar outbox", () => {
	test("agrega la operación si no hay pendientes de esa entidad", () => {
		const nueva = op({ clientEntityId: "a" });
		const resultado = compactar([], nueva);
		expect(resultado).toHaveLength(1);
		expect(resultado[0]).toBe(nueva);
	});

	test("colapsa dos upserts de la misma entidad en uno solo", () => {
		const primero = op({ clientOpId: "1", baseVersion: 5, payload: { titulo: "v1" } });
		const segundo = op({ clientOpId: "2", baseVersion: undefined, payload: { titulo: "v2" } });

		const resultado = compactar([primero], segundo);

		expect(resultado).toHaveLength(1);
		expect(resultado[0].clientOpId).toBe("2");
		expect((resultado[0].payload as { titulo: string }).titulo).toBe("v2");
		expect(resultado[0].baseVersion).toBe(5);
	});

	test("no mezcla operaciones de entidades distintas", () => {
		const a = op({ clientEntityId: "a" });
		const b = op({ clientEntityId: "b" });
		const resultado = compactar([a], b);
		expect(resultado).toHaveLength(2);
	});

	test("un delete reemplaza al upsert pendiente conservando baseVersion", () => {
		const upsert = op({ clientOpId: "1", operation: "upsert", baseVersion: 3 });
		const del = op({ clientOpId: "2", operation: "delete", baseVersion: undefined });

		const resultado = compactar([upsert], del);

		expect(resultado).toHaveLength(1);
		expect(resultado[0].operation).toBe("delete");
		expect(resultado[0].baseVersion).toBe(3);
	});

	test("no colapsa entre tipos de entidad distintos aunque compartan clientEntityId", () => {
		const escrito = op({ clientEntityId: "x", entityType: "escrito" });
		const carpeta = op({ clientEntityId: "x", entityType: "carpeta" });
		const resultado = compactar([escrito], carpeta);
		expect(resultado).toHaveLength(2);
	});
});
