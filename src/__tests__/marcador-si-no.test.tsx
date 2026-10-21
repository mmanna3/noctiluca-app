import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import MarcadorSiNo from "@/components/ui/marcador-si-no";

describe("MarcadorSiNo", () => {
	it("sin marcar: ninguna opción elegida; tocar ✓ marca sí y ✗ marca no", async () => {
		const onCambiar = jest.fn();
		const { getByLabelText } = await render(
			<MarcadorSiNo valor={undefined} nombre="Meditar" onCambiar={onCambiar} />,
		);
		expect(getByLabelText("Meditar: lo hice").props.accessibilityState).toEqual({ checked: false });
		expect(getByLabelText("Meditar: no lo hice").props.accessibilityState).toEqual({ checked: false });
		await fireEvent.press(getByLabelText("Meditar: lo hice"));
		expect(onCambiar).toHaveBeenLastCalledWith(true);
		await fireEvent.press(getByLabelText("Meditar: no lo hice"));
		expect(onCambiar).toHaveBeenLastCalledWith(false);
	});

	it("tocar la opción activa la desmarca (null)", async () => {
		const onCambiar = jest.fn();
		const { getByLabelText } = await render(<MarcadorSiNo valor={false} nombre="Meditar" onCambiar={onCambiar} />);
		expect(getByLabelText("Meditar: no lo hice").props.accessibilityState).toEqual({ checked: true });
		await fireEvent.press(getByLabelText("Meditar: no lo hice"));
		expect(onCambiar).toHaveBeenLastCalledWith(null);
	});

	it("de sí se puede pasar directo a no", async () => {
		const onCambiar = jest.fn();
		const { getByLabelText } = await render(<MarcadorSiNo valor={true} nombre="Meditar" onCambiar={onCambiar} />);
		await fireEvent.press(getByLabelText("Meditar: no lo hice"));
		expect(onCambiar).toHaveBeenLastCalledWith(false);
	});
});
