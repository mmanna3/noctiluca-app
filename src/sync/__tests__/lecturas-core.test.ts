import {
	aEscritoDTO,
	carpetaDesde,
	carpetasRaizDesde,
	claveDeItem,
	diasObjetivosFuturosDesde,
	listaObjetivosDesde,
	ordenarEscritos,
	papeleraDesde,
	todosLosEscritosDesde,
	trackerDiaDesde,
} from "../lecturas-core";
import { CarpetaLocal, EscritoLocal, HabitoLocal, ItemObjetivoLocal, RegistroHabitoLocal } from "../tipos";
import { ItemObjetivoDTO, TipoHabitoEnum, TipoListaObjetivoEnum } from "@/api/clients";

const carpeta = (over: Partial<CarpetaLocal>): CarpetaLocal => ({
	clientId: over.clientId ?? "c-" + Math.random(),
	serverId: over.serverId,
	titulo: over.titulo ?? "Carpeta",
	version: over.version ?? 1,
	posicion: over.posicion,
	criterioDeOrden: over.criterioDeOrden,
	carpetaPadreId: over.carpetaPadreId,
	esSistema: over.esSistema,
	requiereAutenticacion: over.requiereAutenticacion,
	propositoCarpeta: over.propositoCarpeta,
});

const escrito = (over: Partial<EscritoLocal>): EscritoLocal => ({
	clientId: over.clientId ?? "e-" + Math.random(),
	serverId: over.serverId,
	titulo: over.titulo ?? "Escrito",
	cuerpo: over.cuerpo ?? "",
	carpetaClientId: over.carpetaClientId,
	carpetaId: over.carpetaId,
	version: over.version ?? 1,
	fechaHoraCreacion: over.fechaHoraCreacion,
	fechaHoraEdicion: over.fechaHoraEdicion,
	estaEnPapelera: over.estaEnPapelera,
});

describe("carpetasRaizDesde", () => {
	test("solo devuelve raíces, ordenadas por posición, con conteos", () => {
		const carpetas = [
			carpeta({ clientId: "b", serverId: 2, titulo: "B", posicion: 2 }),
			carpeta({ clientId: "a", serverId: 1, titulo: "A", posicion: 1 }),
			carpeta({ clientId: "sub", serverId: 3, titulo: "Sub", carpetaPadreId: 1 }),
		];
		const escritos = [
			escrito({ carpetaClientId: "a" }),
			escrito({ carpetaClientId: "a" }),
			escrito({ carpetaClientId: "a", estaEnPapelera: true }),
		];

		const raices = carpetasRaizDesde(carpetas, escritos);

		expect(raices.map((c) => c.titulo)).toEqual(["A", "B"]);
		expect(raices[0].cantidadDeEscritos).toBe(2);
		expect(raices[0].cantidadDeSubCarpetas).toBe(1);
		expect(raices[1].cantidadDeEscritos).toBe(0);
	});
});

describe("carpetaDesde", () => {
	test("incluye escritos (sin papelera) y subcarpetas", () => {
		const carpetas = [
			carpeta({ clientId: "raiz", serverId: 1, titulo: "Raíz", criterioDeOrden: 3 }),
			carpeta({ clientId: "sub", serverId: 5, titulo: "Sub", carpetaPadreId: 1 }),
		];
		const escritos = [
			escrito({ clientId: "z", carpetaClientId: "raiz", titulo: "Zeta" }),
			escrito({ clientId: "a", carpetaClientId: "raiz", titulo: "Alfa" }),
			escrito({ clientId: "p", carpetaClientId: "raiz", titulo: "Papelera", estaEnPapelera: true }),
		];

		const dto = carpetaDesde(1, carpetas, escritos);

		expect(dto).not.toBeNull();
		expect(dto?.cantidadDeEscritos).toBe(2);
		expect(dto?.cantidadDeSubCarpetas).toBe(1);
		expect(dto?.escritos?.map((e) => e.titulo)).toEqual(["Alfa", "Zeta"]);
		expect(dto?.subCarpetas?.[0].titulo).toBe("Sub");
	});

	test("devuelve null si no existe", () => {
		expect(carpetaDesde(999, [], [])).toBeNull();
		expect(carpetaDesde(undefined, [], [])).toBeNull();
	});

	test("asocia escritos por carpetaId cuando no hay carpetaClientId", () => {
		const carpetas = [carpeta({ clientId: "raiz", serverId: 7, titulo: "Raíz" })];
		const escritos = [escrito({ carpetaId: 7, titulo: "Por id numérico" })];

		const dto = carpetaDesde(7, carpetas, escritos);

		expect(dto?.cantidadDeEscritos).toBe(1);
	});
});

describe("ordenarEscritos", () => {
	const base = [
		escrito({ titulo: "B", fechaHoraCreacion: "2024-01-02T00:00:00Z" }),
		escrito({ titulo: "A", fechaHoraCreacion: "2024-01-03T00:00:00Z" }),
		escrito({ titulo: "C", fechaHoraCreacion: "2024-01-01T00:00:00Z" }),
	];

	test("criterio 1: creación descendente (default)", () => {
		expect(ordenarEscritos(base, 1).map((e) => e.titulo)).toEqual(["A", "B", "C"]);
		expect(ordenarEscritos(base, undefined).map((e) => e.titulo)).toEqual(["A", "B", "C"]);
	});

	test("criterio 3: alfabético A-Z", () => {
		expect(ordenarEscritos(base, 3).map((e) => e.titulo)).toEqual(["A", "B", "C"]);
	});

	test("criterio 4: creación ascendente", () => {
		expect(ordenarEscritos(base, 4).map((e) => e.titulo)).toEqual(["C", "B", "A"]);
	});

	test("no muta el arreglo original", () => {
		const copia = [...base];
		ordenarEscritos(base, 3);
		expect(base).toEqual(copia);
	});
});

describe("papeleraDesde / todosLosEscritosDesde", () => {
	const carpetas = [carpeta({ clientId: "c1", serverId: 1, titulo: "Trabajo" })];
	const escritos = [
		escrito({ clientId: "a", carpetaClientId: "c1", titulo: "Vigente" }),
		escrito({ clientId: "b", carpetaClientId: "c1", titulo: "Borrado", estaEnPapelera: true }),
	];

	test("papeleraDesde solo trae los eliminados con título de carpeta", () => {
		const papelera = papeleraDesde(carpetas, escritos);
		expect(papelera).toHaveLength(1);
		expect(papelera[0].titulo).toBe("Borrado");
		expect(papelera[0].carpetaTitulo).toBe("Trabajo");
	});

	test("todosLosEscritosDesde excluye los de papelera", () => {
		const todos = todosLosEscritosDesde(carpetas, escritos);
		expect(todos).toHaveLength(1);
		expect(todos[0].titulo).toBe("Vigente");
		expect(todos[0].carpetaTitulo).toBe("Trabajo");
	});
});

describe("aEscritoDTO", () => {
	test("mapea campos y usa serverId como id", () => {
		const dto = aEscritoDTO(
			escrito({ clientId: "guid", serverId: 42, titulo: "T", cuerpo: "C" }),
			"Mi Carpeta",
		);
		expect(dto.id).toBe(42);
		expect(dto.clientId).toBe("guid");
		expect(dto.carpetaTitulo).toBe("Mi Carpeta");
	});

	test("escrito offline sin serverId deja id indefinido pero conserva clientId", () => {
		const dto = aEscritoDTO(escrito({ clientId: "guid-offline", serverId: undefined }));
		expect(dto.id).toBeUndefined();
		expect(dto.clientId).toBe("guid-offline");
	});
});

describe("trackerDiaDesde", () => {
	test("devuelve hábitos activos con registro del día", () => {
		const habitos: HabitoLocal[] = [
			{ clientId: "h1", nombre: "Meditar", tipo: TipoHabitoEnum._1, activo: true, posicion: 0, version: 1 },
			{ clientId: "h2", nombre: "Inactivo", tipo: TipoHabitoEnum._1, activo: false, posicion: 1, version: 1 },
		];
		const registros: RegistroHabitoLocal[] = [
			{
				clientId: "r1",
				habitoClientId: "h1",
				fecha: "2026-07-01",
				valorBooleano: true,
				version: 1,
				pendiente: false,
			},
		];
		const vista = trackerDiaDesde(habitos, registros, new Date(2026, 6, 1));
		expect(vista).toHaveLength(1);
		expect(vista[0].nombre).toBe("Meditar");
		expect(vista[0].valorBooleano).toBe(true);
		expect(vista[0].clientId).toBe("h1");
	});
});

describe("listaObjetivosDesde", () => {
	test("agrupa ítems por tipo y clave de período", () => {
		const items: ItemObjetivoLocal[] = [
			{
				clientId: "i2",
				texto: "B",
				completado: false,
				posicion: 1,
				listaTipo: TipoListaObjetivoEnum._1,
				listaClavePeriodo: "2026-07-01",
				version: 1,
				pendiente: false,
			},
			{
				clientId: "i1",
				texto: "A",
				completado: true,
				posicion: 0,
				listaTipo: TipoListaObjetivoEnum._1,
				listaClavePeriodo: "2026-07-01",
				version: 1,
				pendiente: false,
			},
		];
		const lista = listaObjetivosDesde([], items, TipoListaObjetivoEnum._1, "2026-07-01");
		expect(lista.items?.map((i) => i.texto)).toEqual(["A", "B"]);
	});
});

describe("diasObjetivosFuturosDesde", () => {
	const referencia = new Date(2026, 6, 5);

	test("agrupa días futuros con texto y excluye hoy y vacíos", () => {
		const items: ItemObjetivoLocal[] = [
			{
				clientId: "hoy",
				texto: "Hoy",
				completado: false,
				posicion: 0,
				listaTipo: TipoListaObjetivoEnum._1,
				listaClavePeriodo: "2026-07-05",
				version: 1,
			},
			{
				clientId: "m1",
				texto: "Mañana 1",
				completado: false,
				posicion: 0,
				listaTipo: TipoListaObjetivoEnum._1,
				listaClavePeriodo: "2026-07-06",
				version: 1,
			},
			{
				clientId: "m2",
				texto: "Mañana 2",
				completado: false,
				posicion: 1,
				listaTipo: TipoListaObjetivoEnum._1,
				listaClavePeriodo: "2026-07-06",
				version: 1,
			},
			{
				clientId: "vacio",
				texto: " ",
				completado: false,
				posicion: 0,
				listaTipo: TipoListaObjetivoEnum._1,
				listaClavePeriodo: "2026-07-10",
				version: 1,
			},
			{
				clientId: "lejano",
				texto: "Lejos",
				completado: false,
				posicion: 0,
				listaTipo: TipoListaObjetivoEnum._1,
				listaClavePeriodo: "2026-07-15",
				version: 1,
			},
		];

		const dias = diasObjetivosFuturosDesde(items, referencia);
		expect(dias).toHaveLength(2);
		expect(dias[0]).toMatchObject({ clavePeriodo: "2026-07-06", cantidad: 2 });
		expect(dias[1]).toMatchObject({ clavePeriodo: "2026-07-15", cantidad: 1 });
	});
});

describe("claveDeItem", () => {
	test("prefiere clientId sobre id de servidor", () => {
		const item = new ItemObjetivoDTO({ id: 5, clientId: "guid", texto: "Objetivo" });
		expect(claveDeItem(item)).toBe("guid");
	});
});
