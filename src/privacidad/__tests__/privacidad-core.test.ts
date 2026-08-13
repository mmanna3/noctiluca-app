import {
	carpetaRaizDe,
	esCarpetaPrivada,
	escritoEsPrivado,
	evaluarDestinoPrivado,
	filtrarEscritosPublicos,
} from "../privacidad-core";
import { CarpetaLocal, EscritoLocal } from "@/sync/tipos";

const carpeta = (over: Partial<CarpetaLocal> & { clientId: string; serverId: number }): CarpetaLocal => ({
	titulo: "c",
	version: 1,
	...over,
});

describe("privacidad-core", () => {
	const carpetas: CarpetaLocal[] = [
		carpeta({ clientId: "r1", serverId: 1, titulo: "Pública", requiereAutenticacion: false }),
		carpeta({
			clientId: "r2",
			serverId: 2,
			titulo: "Privada",
			requiereAutenticacion: true,
		}),
		carpeta({
			clientId: "s1",
			serverId: 3,
			titulo: "Sub",
			carpetaPadreId: 2,
		}),
	];

	test("carpetaRaizDe resuelve subcarpeta hasta raíz", () => {
		expect(carpetaRaizDe(3, carpetas)?.serverId).toBe(2);
	});

	test("esCarpetaPrivada usa raíz", () => {
		expect(esCarpetaPrivada(1, carpetas)).toBe(false);
		expect(esCarpetaPrivada(2, carpetas)).toBe(true);
		expect(esCarpetaPrivada(3, carpetas)).toBe(true);
	});

	test("escritoEsPrivado por carpetaId", () => {
		const escrito: EscritoLocal = {
			clientId: "e1",
			titulo: "x",
			cuerpo: "",
			version: 1,
			carpetaId: 3,
		};
		expect(escritoEsPrivado(escrito, carpetas)).toBe(true);
	});

	test("evaluarDestinoPrivado rutas especiales", () => {
		expect(evaluarDestinoPrivado("/modo-lectura", {}, carpetas)).toBe("modo_lectura");
		expect(evaluarDestinoPrivado("/papelera", {}, carpetas)).toBe("papelera");
		expect(evaluarDestinoPrivado("/carpetas-privadas", {}, carpetas)).toBe("config_privacidad");
	});

	test("evaluarDestinoPrivado carpeta pública no requiere sesión", () => {
		expect(
			evaluarDestinoPrivado("/1/escritos", { carpetaId: "1" }, carpetas),
		).toBeNull();
	});

	test("evaluarDestinoPrivado carpeta privada requiere sesión", () => {
		expect(
			evaluarDestinoPrivado("/2/escritos", { carpetaId: "2" }, carpetas),
		).toBe("carpeta_privada");
	});

	test("filtrarEscritosPublicos excluye privados", () => {
		const escritos: EscritoLocal[] = [
			{ clientId: "e1", titulo: "a", cuerpo: "", version: 1, carpetaId: 1 },
			{ clientId: "e2", titulo: "b", cuerpo: "", version: 1, carpetaId: 2 },
		];
		const filtrados = filtrarEscritosPublicos(escritos, carpetas);
		expect(filtrados).toHaveLength(1);
		expect(filtrados[0].clientId).toBe("e1");
	});
});
