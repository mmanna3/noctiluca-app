import { MINIMO_CARACTERES_BUSQUEDA } from "@/utils/busqueda";

describe("MINIMO_CARACTERES_BUSQUEDA", () => {
	it("es 2", () => {
		expect(MINIMO_CARACTERES_BUSQUEDA).toBe(2);
	});

	it("una cadena de 1 caracter no activa búsqueda", () => {
		expect("a".length >= MINIMO_CARACTERES_BUSQUEDA).toBe(false);
	});

	it("una cadena de 2 caracteres activa búsqueda", () => {
		expect("ab".length >= MINIMO_CARACTERES_BUSQUEDA).toBe(true);
	});
});
