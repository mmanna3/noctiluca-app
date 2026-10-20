import { createContext, forwardRef, useContext } from "react";
import {
	Text as TextRN,
	TextInput as TextInputRN,
	TextInputProps,
	TextProps,
	TextStyle,
} from "react-native";

/**
 * Tipografía de la app, igual en web y en iOS: Instrument Sans en todos los
 * textos, también en los escritos.
 *
 * En nativo la fuente no se hereda de un estilo global (NativeWind no aplica
 * el selector `*`), y en web las clases de react-native-web le ganan a esa
 * regla. Por eso todos los textos usan estos componentes en vez de los de
 * react-native: le ponen a cada uno la familia del peso que corresponde.
 *
 * Cada peso es una familia aparte (`InstrumentSans_600SemiBold`), así que el
 * peso se lee de las clases `font-*` y se traduce a la familia. Las fuentes se
 * cargan en `src/app/_layout.tsx` (`FUENTES`).
 */
export const FAMILIAS = {
	400: "InstrumentSans_400Regular",
	500: "InstrumentSans_500Medium",
	600: "InstrumentSans_600SemiBold",
	700: "InstrumentSans_700Bold",
} as const;

export type Peso = keyof typeof FAMILIAS;

const PESO_POR_CLASE: Record<string, Peso> = {
	"font-thin": 400,
	"font-extralight": 400,
	"font-light": 400,
	"font-normal": 400,
	"font-medium": 500,
	"font-semibold": 600,
	"font-bold": 700,
	"font-extrabold": 700,
	"font-black": 700,
};

const sinVariante = (clase: string) => clase.slice(clase.lastIndexOf(":") + 1);

/** Peso pedido por las clases (la última `font-*` gana), o undefined si no hay ninguna. */
export const pesoDeClases = (className?: string): Peso | undefined => {
	let peso: Peso | undefined;
	for (const clase of className?.split(/\s+/) ?? []) {
		const c = sinVariante(clase);
		if (c in PESO_POR_CLASE) peso = PESO_POR_CLASE[c];
	}
	return peso;
};

/**
 * Saca las clases de peso: la familia ya trae el peso, y un
 * `fontWeight` encima la rompe en las dos plataformas.
 * - En iOS, si recibe un peso, React Native busca la cara "más cercana" entre
 *   todas las de la familia en vez de usar la pedida.
 * - En web, expo-font declara cada familia sin peso, y pedirle 600 a una familia
 *   "de peso 400" hace que el navegador engrose de más la letra.
 * No alcanza con pisar `fontWeight` en `style`: en nativo un `undefined` no
 * pisa el valor que viene de la clase.
 */
export const sinClasesDeFuente = (className?: string): string | undefined =>
	className
		?.split(/\s+/)
		.filter((clase) => !(sinVariante(clase) in PESO_POR_CLASE))
		.join(" ");

/** Estilo de fuente para un peso (sin `fontWeight`: ver `sinClasesDeFuente`). */
export const estiloFuente = (peso: Peso): TextStyle => ({ fontFamily: FAMILIAS[peso] });

/**
 * Peso del texto padre, para los anidados: si no piden peso, heredan la fuente
 * del padre sin tocarla. `null` = no está anidado.
 */
const PesoPadre = createContext<Peso | null>(null);

export const Text = forwardRef<TextRN, TextProps>(function Text(props, ref) {
	const padre = useContext(PesoPadre);
	const pesoPedido = pesoDeClases(props.className);
	const peso = pesoPedido ?? padre ?? 400;
	const heredaSinCambios = padre !== null && !pesoPedido;
	return (
		<PesoPadre.Provider value={peso}>
			<TextRN
				ref={ref}
				{...props}
				className={sinClasesDeFuente(props.className)}
				style={heredaSinCambios ? props.style : [props.style, estiloFuente(peso)]}
			/>
		</PesoPadre.Provider>
	);
});

export const TextInput = forwardRef<TextInputRN, TextInputProps>(function TextInput(props, ref) {
	const peso = pesoDeClases(props.className) ?? 400;
	return (
		<TextInputRN
			ref={ref}
			{...props}
			className={sinClasesDeFuente(props.className)}
			style={[props.style, estiloFuente(peso)]}
		/>
	);
});
