import React from "react";
import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { estiloDeClases, FAMILIAS, pesoDeClases, sinClasesDeFuente, Text, TextInput } from "@/components/ui/texto";

const FAMILIA_POR_PESO = FAMILIAS.sans;

const familia = (el: { props: { style?: unknown } }) => StyleSheet.flatten(el.props.style as never)?.fontFamily;

describe("pesoDeClases", () => {
	test("sin clases de peso devuelve undefined", () => {
		expect(pesoDeClases(undefined)).toBeUndefined();
		expect(pesoDeClases("text-xs text-gray-500")).toBeUndefined();
	});

	test("traduce cada clase a su peso", () => {
		expect(pesoDeClases("font-normal")).toBe(400);
		expect(pesoDeClases("text-base font-medium")).toBe(500);
		expect(pesoDeClases("font-semibold text-white")).toBe(600);
		expect(pesoDeClases("font-bold")).toBe(700);
	});

	test("la última clase de peso gana, y se ignoran variantes", () => {
		expect(pesoDeClases("font-medium font-semibold")).toBe(600);
		expect(pesoDeClases("md:font-bold")).toBe(700);
	});

	test("no confunde font-serif u otras clases parecidas", () => {
		expect(pesoDeClases("font-serif fontx-bold")).toBeUndefined();
	});
});

describe("estiloDeClases", () => {
	test("detecta la familia pedida", () => {
		expect(estiloDeClases("text-base")).toBeUndefined();
		expect(estiloDeClases("font-serif text-base")).toBe("serif");
		expect(estiloDeClases("font-serif font-sans")).toBe("sans");
	});
});

describe("sinClasesDeFuente", () => {
	test("saca solo las clases de peso y de familia", () => {
		expect(sinClasesDeFuente("text-xs font-medium text-gray-500")).toBe("text-xs text-gray-500");
		expect(sinClasesDeFuente("md:font-bold py-2 font-serif")).toBe("py-2");
		expect(sinClasesDeFuente(undefined)).toBeUndefined();
	});
});

describe("Text", () => {
	test("sin peso ni familia usa la sans regular", async () => {
		const { getByText } = await render(<Text>Hola</Text>);
		expect(familia(getByText("Hola"))).toBe(FAMILIA_POR_PESO[400]);
	});

	test("usa la familia del peso pedido", async () => {
		const { getByText } = await render(<Text className="font-semibold">Título</Text>);
		expect(familia(getByText("Título"))).toBe(FAMILIA_POR_PESO[600]);
	});

	test("no le pasa la clase de peso al texto (la familia ya trae el peso)", async () => {
		const { getByText } = await render(<Text className="text-xl font-semibold text-slate-900">Peso</Text>);
		const el = getByText("Peso");
		expect(el.props.className).toBe("text-xl text-slate-900");
		expect(StyleSheet.flatten(el.props.style).fontWeight).toBeUndefined();
		expect(familia(el)).toBe(FAMILIA_POR_PESO[600]);
	});

	test("respeta el resto del estilo", async () => {
		const { getByText } = await render(<Text style={{ color: "red" }}>Rojo</Text>);
		const estilo = StyleSheet.flatten(getByText("Rojo").props.style);
		expect(estilo.color).toBe("red");
		expect(estilo.fontFamily).toBe(FAMILIA_POR_PESO[400]);
	});

	test("un texto anidado sin peso hereda la fuente del padre", async () => {
		const { getByText } = await render(
			<Text className="font-semibold">
				Hola <Text>mundo</Text>
			</Text>,
		);
		expect(familia(getByText("mundo"))).toBeUndefined();
	});

	test("un texto anidado con peso usa el suyo", async () => {
		const { getByText } = await render(
			<Text>
				Hola <Text className="font-bold">mundo</Text>
			</Text>,
		);
		expect(familia(getByText("mundo"))).toBe(FAMILIA_POR_PESO[700]);
	});
});

describe("Text serif", () => {
	test("font-serif usa Source Serif con el peso pedido", async () => {
		const { getByText } = await render(<Text className="font-serif font-semibold">Escrito</Text>);
		expect(familia(getByText("Escrito"))).toBe(FAMILIAS.serif[600]);
	});

	test("un anidado que pide solo el peso conserva la familia serif del padre", async () => {
		const { getByText } = await render(
			<Text className="font-serif">
				Hola <Text className="font-bold">mundo</Text>
			</Text>,
		);
		expect(familia(getByText("mundo"))).toBe(FAMILIAS.serif[700]);
	});

	test("un anidado que pide solo la familia conserva el peso del padre", async () => {
		const { getByText } = await render(
			<Text className="font-semibold">
				Hola <Text className="font-serif">mundo</Text>
			</Text>,
		);
		expect(familia(getByText("mundo"))).toBe(FAMILIAS.serif[600]);
	});
});

describe("TextInput", () => {
	test("font-serif usa Source Serif", async () => {
		const { getByPlaceholderText } = await render(<TextInput placeholder="Texto" className="font-serif" />);
		expect(familia(getByPlaceholderText("Texto"))).toBe(FAMILIAS.serif[400]);
	});

	test("por defecto usa la sans regular", async () => {
		const { getByPlaceholderText } = await render(<TextInput placeholder="Buscar" />);
		expect(familia(getByPlaceholderText("Buscar"))).toBe(FAMILIA_POR_PESO[400]);
	});
});
