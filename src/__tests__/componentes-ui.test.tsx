import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Boton, BotonIcono } from "@/components/ui/botones";
import Encabezado from "@/components/ui/encabezado";
import Cuerpo from "@/components/ui/cuerpo";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ListaItem from "@/components/ui/lista-item";
import { Input } from "@/components/ui/input-ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PuntoMarcador, { PuntoMarcadorVisual } from "@/components/ui/punto-marcador";
import AvisoSoloOnline from "@/components/ui/aviso-solo-online";
import { Text } from "react-native";

describe("Boton", () => {
	it("renderiza el texto de los hijos", async () => {
		const { getByText } = await render(<Boton>Guardar</Boton>);
		expect(getByText("Guardar")).toBeTruthy();
	});

	it("llama onClick al presionar", async () => {
		const onPress = jest.fn();
		const { getByText } = await render(<Boton onClick={onPress}>OK</Boton>);
		fireEvent.press(getByText("OK"));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it("no llama onClick cuando está disabled", async () => {
		const onPress = jest.fn();
		const { getByText } = await render(<Boton onClick={onPress} disabled>OK</Boton>);
		fireEvent.press(getByText("OK"));
		expect(onPress).not.toHaveBeenCalled();
	});

	it("renderiza variante soloBorde", async () => {
		const { getByText } = await render(<Boton soloBorde>Cancelar</Boton>);
		expect(getByText("Cancelar")).toBeTruthy();
	});

	it("renderiza variante sinBorde", async () => {
		const { getByText } = await render(<Boton sinBorde>Limpiar</Boton>);
		expect(getByText("Limpiar")).toBeTruthy();
	});
});

describe("BotonIcono", () => {
	it("renderiza contenido hijo", async () => {
		const { getByText } = await render(<BotonIcono><Text>+</Text></BotonIcono>);
		expect(getByText("+")).toBeTruthy();
	});
});

describe("Encabezado", () => {
	it("renderiza sus hijos", async () => {
		const { getByText } = await render(
			<Encabezado>
				<Text>Título</Text>
			</Encabezado>
		);
		expect(getByText("Título")).toBeTruthy();
	});
});

describe("Cuerpo", () => {
	it("renderiza sus hijos", async () => {
		const { getByText } = await render(
			<Cuerpo>
				<Text>Contenido</Text>
			</Cuerpo>
		);
		expect(getByText("Contenido")).toBeTruthy();
	});
});

describe("LoadingSpinner", () => {
	it("renderiza sin errores", async () => {
		const { toJSON } = await render(<LoadingSpinner />);
		expect(toJSON()).toBeTruthy();
	});
});

describe("ListaItem", () => {
	it("renderiza título y subtítulo", async () => {
		const { getByText } = await render(
			<ListaItem titulo="Mi escrito" subtitulo="Carpeta A" onClick={jest.fn()} />
		);
		expect(getByText("Mi escrito")).toBeTruthy();
		expect(getByText("Carpeta A")).toBeTruthy();
	});

	it("llama onClick al presionar", async () => {
		const onPress = jest.fn();
		const { getByText } = await render(
			<ListaItem titulo="Item" subtitulo="Sub" onClick={onPress} />
		);
		fireEvent.press(getByText("Item"));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it("muestra la fecha formateada", async () => {
		const { getByText } = await render(
			<ListaItem titulo="T" subtitulo="S" fecha="2024-06-15T00:00:00" onClick={jest.fn()} />
		);
		expect(getByText("15.06.24")).toBeTruthy();
	});
});

describe("Input", () => {
	it("renderiza con el valor dado", async () => {
		const { getByDisplayValue } = await render(
			<Input value="hola" onChange={jest.fn()} />
		);
		expect(getByDisplayValue("hola")).toBeTruthy();
	});

	it("llama onChange con el nuevo valor", async () => {
		const onChange = jest.fn();
		const { getByDisplayValue } = await render(<Input value="abc" onChange={onChange} />);
		fireEvent.changeText(getByDisplayValue("abc"), "xyz");
		expect(onChange).toHaveBeenCalledWith("xyz");
	});
});

describe("Card", () => {
	it("renderiza con contenido anidado", async () => {
		const { getByText } = await render(
			<Card>
				<CardHeader>
					<CardTitle>Mi tarjeta</CardTitle>
				</CardHeader>
				<CardContent>
					<Text>Contenido aquí</Text>
				</CardContent>
			</Card>
		);
		expect(getByText("Mi tarjeta")).toBeTruthy();
		expect(getByText("Contenido aquí")).toBeTruthy();
	});
});

describe("PuntoMarcador", () => {
	it("llama onClick al presionar", async () => {
		const onClick = jest.fn();
		const { getByRole } = await render(<PuntoMarcador marcado={false} onClick={onClick} />);
		fireEvent.press(getByRole("checkbox"));
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("refleja estado marcado via accessibilityState", async () => {
		const { getByRole } = await render(<PuntoMarcador marcado={true} onClick={jest.fn()} />);
		expect(getByRole("checkbox", { checked: true })).toBeTruthy();
	});
});

describe("PuntoMarcadorVisual", () => {
	it("renderiza sin errores", async () => {
		const { toJSON } = await render(<PuntoMarcadorVisual marcado={false} />);
		expect(toJSON()).toBeTruthy();
	});
});

describe("AvisoSoloOnline", () => {
	it("muestra el mensaje por defecto", async () => {
		const { getByText } = await render(<AvisoSoloOnline />);
		expect(getByText("Esta función requiere conexión a internet.")).toBeTruthy();
	});

	it("muestra un mensaje personalizado", async () => {
		const { getByText } = await render(<AvisoSoloOnline mensaje="Solo disponible online" />);
		expect(getByText("Solo disponible online")).toBeTruthy();
	});
});
