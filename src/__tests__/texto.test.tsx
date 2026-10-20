import React from "react";
import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { FAMILIAS, pesoDeClases, sinClasesDeFuente, Text, TextInput } from "@/components/ui/texto";


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

	test("no confunde otras clases parecidas", () => {
		expect(pesoDeClases("font-sans fontx-bold")).toBeUndefined();
	});
});

describe("sinClasesDeFuente", () => {
	test("saca solo las clases de peso", () => {
		expect(sinClasesDeFuente("text-xs font-medium text-gray-500")).toBe("text-xs text-gray-500");
		expect(sinClasesDeFuente("md:font-bold py-2")).toBe("py-2");
		expect(sinClasesDeFuente(undefined)).toBeUndefined();
	});
});

describe("Text", () => {
	test("sin peso ni familia usa la sans regular", async () => {
		const { getByText } = await render(<Text>Hola</Text>);
		expect(familia(getByText("Hola"))).toBe(FAMILIAS[400]);
	});

	test("usa la familia del peso pedido", async () => {
		const { getByText } = await render(<Text className="font-semibold">Título</Text>);
		expect(familia(getByText("Título"))).toBe(FAMILIAS[600]);
	});

	test("no le pasa la clase de peso al texto (la familia ya trae el peso)", async () => {
		const { getByText } = await render(<Text className="text-xl font-semibold text-slate-900">Peso</Text>);
		const el = getByText("Peso");
		expect(el.props.className).toBe("text-xl text-slate-900");
		expect(StyleSheet.flatten(el.props.style).fontWeight).toBeUndefined();
		expect(familia(el)).toBe(FAMILIAS[600]);
	});

	test("respeta el resto del estilo", async () => {
		const { getByText } = await render(<Text style={{ color: "red" }}>Rojo</Text>);
		const estilo = StyleSheet.flatten(getByText("Rojo").props.style);
		expect(estilo.color).toBe("red");
		expect(estilo.fontFamily).toBe(FAMILIAS[400]);
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
		expect(familia(getByText("mundo"))).toBe(FAMILIAS[700]);
	});
});

describe("TextInput", () => {
	test("usa la familia del peso pedido", async () => {
		const { getByPlaceholderText } = await render(<TextInput placeholder="Título" className="text-xl font-semibold" />);
		expect(familia(getByPlaceholderText("Título"))).toBe(FAMILIAS[600]);
	});

	test("por defecto usa la sans regular", async () => {
		const { getByPlaceholderText } = await render(<TextInput placeholder="Buscar" />);
		expect(familia(getByPlaceholderText("Buscar"))).toBe(FAMILIAS[400]);
	});
});
