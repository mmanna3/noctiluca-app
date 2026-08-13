import { convertirEnKey, fechaEsDeHaceMenosDe5Minutos, generarKeyAPartirDeFecha } from "../utilidades";

test("generarKeyAPartirDeFecha", () => {
	const fecha = new Date(Date.UTC(2022, 2, 29, 18, 44, 31));
	const resultado = generarKeyAPartirDeFecha(fecha);
	expect(resultado).toBe("20220329184431");
});

test("convertirEnKey: Espacios y mayúsculas en el medio", () => {
	const resultado = convertirEnKey("Las campanas no doblan por nadie");
	expect(resultado).toBe("las_campanas_no_doblan_por_nadie");
});

test("convertirEnKey: Elimina comas, puntos y signos de interrogación y admiración", () => {
	const resultado = convertirEnKey("¡Hola!, ¿cómo estás?.");
	expect(resultado).toBe("hola_cómo_estás");
});

test("convertirEnKey: Mantiene guiones bajos", () => {
	const resultado = convertirEnKey("¡Hola!,_cómo estás?.");
	expect(resultado).toBe("hola_cómo_estás");
});

test("convertirEnKey: Trimea bien", () => {
	const resultado = convertirEnKey("    Anémona     ");
	expect(resultado).toBe("anémona");
});

test("fechaEsDeHaceMenosDe5Minutos: no", () => {
	const ahora = new Date();
	const hace2Horas = new Date(ahora);
	hace2Horas.setHours(ahora.getHours() - 2);
	expect(fechaEsDeHaceMenosDe5Minutos(hace2Horas)).toBe(false);
});

test("fechaEsDeHaceMenosDe5Minutos: sí", () => {
	const ahora = new Date();
	const hace3Minutos = new Date(ahora);
	hace3Minutos.setMinutes(ahora.getMinutes() - 3);
	expect(fechaEsDeHaceMenosDe5Minutos(hace3Minutos)).toBe(true);
});
