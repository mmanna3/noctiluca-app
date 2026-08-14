import { validarHabito } from "@/utils/validar-habito";

describe("validarHabito", () => {
	it("nombre vacío devuelve error", () => {
		expect(validarHabito("")).toBe("El nombre es obligatorio");
	});

	it("nombre sólo espacios devuelve error", () => {
		expect(validarHabito("   ")).toBe("El nombre es obligatorio");
	});

	it("nombre de más de 50 caracteres devuelve error", () => {
		expect(validarHabito("a".repeat(51))).toBe("Máximo 50 caracteres");
	});

	it("nombre válido devuelve cadena vacía", () => {
		expect(validarHabito("Meditar")).toBe("");
	});

	it("nombre de exactamente 50 caracteres es válido", () => {
		expect(validarHabito("a".repeat(50))).toBe("");
	});

	it("nombre con espacios al inicio/final se trimea antes de validar", () => {
		expect(validarHabito("  Correr  ")).toBe("");
	});
});
