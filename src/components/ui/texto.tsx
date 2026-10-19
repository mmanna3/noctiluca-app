import { createContext, forwardRef, useContext } from "react";
import {
	Text as TextRN,
	TextInput as TextInputRN,
	TextInputProps,
	TextProps,
	TextStyle,
} from "react-native";

/**
 * Tipografía de la app, igual en web y en iOS:
 * - Instrument Sans para la interfaz (por defecto).
 * - Source Serif 4 para lo que se lee y escribe: los escritos. Se pide con la
 *   clase `font-serif`.
 *
 * En nativo la fuente no se hereda de un estilo global (NativeWind no aplica
 * el selector `*`), y en web las clases de react-native-web le ganan a esa
 * regla. Por eso todos los textos usan estos componentes en vez de los de
 * react-native: le ponen a cada uno la familia que corresponde.
 *
 * Cada peso es una familia aparte (`InstrumentSans_600SemiBold`), así que el
 * peso se lee de las clases `font-*` y se traduce a la familia. Las fuentes se
 * cargan en `src/app/_layout.tsx` (`FUENTES`).
 */
export const FAMILIAS = {
	sans: {
		400: "InstrumentSans_400Regular",
		500: "InstrumentSans_500Medium",
		600: "InstrumentSans_600SemiBold",
		700: "InstrumentSans_700Bold",
	},
	serif: {
		400: "SourceSerif4_400Regular",
		500: "SourceSerif4_500Medium",
		600: "SourceSerif4_600SemiBold",
		700: "SourceSerif4_700Bold",
	},
} as const;

export type Estilo = keyof typeof FAMILIAS;
export type Peso = keyof (typeof FAMILIAS)["sans"];

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

const ESTILO_POR_CLASE: Record<string, Estilo> = {
	"font-sans": "sans",
	"font-serif": "serif",
};

const sinVariante = (clase: string) => clase.slice(clase.lastIndexOf(":") + 1);

/** Lo último que encuentre de `mapa` en las clases (la última gana), o undefined. */
const buscarEnClases = <T,>(className: string | undefined, mapa: Record<string, T>): T | undefined => {
	let valor: T | undefined;
	for (const clase of className?.split(/\s+/) ?? []) {
		const c = sinVariante(clase);
		if (c in mapa) valor = mapa[c];
	}
	return valor;
};

/** Peso pedido por las clases (la última `font-*` gana), o undefined si no hay ninguna. */
export const pesoDeClases = (className?: string): Peso | undefined => buscarEnClases(className, PESO_POR_CLASE);

/** Familia pedida por las clases (`font-sans` / `font-serif`), o undefined. */
export const estiloDeClases = (className?: string): Estilo | undefined => buscarEnClases(className, ESTILO_POR_CLASE);

/**
 * Saca las clases de peso y de familia: la familia ya trae el peso, y un
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
		.filter((clase) => !(sinVariante(clase) in PESO_POR_CLASE || sinVariante(clase) in ESTILO_POR_CLASE))
		.join(" ");

/** Estilo de fuente para un peso y familia (sin `fontWeight`: ver `sinClasesDeFuente`). */
export const estiloFuente = (peso: Peso, estilo: Estilo = "sans"): TextStyle => ({ fontFamily: FAMILIAS[estilo][peso] });

/**
 * Fuente del texto padre, para los anidados: si no piden nada, heredan la del
 * padre sin tocarla; si piden solo el peso o solo la familia, completan con la
 * del padre. `null` = no está anidado.
 */
const FuentePadre = createContext<{ estilo: Estilo; peso: Peso } | null>(null);

export const Text = forwardRef<TextRN, TextProps>(function Text(props, ref) {
	const padre = useContext(FuentePadre);
	const pesoPedido = pesoDeClases(props.className);
	const estiloPedido = estiloDeClases(props.className);
	const fuente = { estilo: estiloPedido ?? padre?.estilo ?? "sans", peso: pesoPedido ?? padre?.peso ?? 400 };
	const heredaSinCambios = padre && !pesoPedido && !estiloPedido;
	return (
		<FuentePadre.Provider value={fuente}>
			<TextRN
				ref={ref}
				{...props}
				className={sinClasesDeFuente(props.className)}
				style={heredaSinCambios ? props.style : [props.style, estiloFuente(fuente.peso, fuente.estilo)]}
			/>
		</FuentePadre.Provider>
	);
});

export const TextInput = forwardRef<TextInputRN, TextInputProps>(function TextInput(props, ref) {
	const peso = pesoDeClases(props.className) ?? 400;
	const estilo = estiloDeClases(props.className) ?? "sans";
	return (
		<TextInputRN
			ref={ref}
			{...props}
			className={sinClasesDeFuente(props.className)}
			style={[props.style, estiloFuente(peso, estilo)]}
		/>
	);
});
