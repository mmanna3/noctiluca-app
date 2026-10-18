import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface Props {
	soloBorde?: boolean;
	sinBorde?: boolean;
	chiquito?: boolean;
	color?: "default" | "gris";
	children: ReactNode;
	onClick?: () => void;
	className?: string;
	disabled?: boolean;
}

/**
 * Clases comunes de interacción: opacidad al tocar (0.2, igual que el
 * TouchableOpacity de antes) y, en web, cursor de mano. Los `hover:` de cada variante solo se
 * ven con mouse, así que no cambian nada en el iPhone.
 */
const interaccion = (disabled?: boolean) =>
	disabled ? "opacity-50 web:cursor-default" : "active:opacity-20 web:cursor-pointer";

export const Boton = (props: Props) => {
	const hover = (clase: string) => (props.disabled ? "" : clase);

	if (props.sinBorde)
		return (
			<Pressable
				onPress={props.disabled ? undefined : props.onClick}
				disabled={props.disabled}
				className={`rounded ${props.chiquito ? "h-6 px-2" : "h-11 px-4"} items-center justify-center ${hover("hover:bg-gray-100")} ${interaccion(props.disabled)} ${props.className ?? ""}`}
			>
				<Text className={`text-slate-900 font-medium ${props.chiquito ? "text-xs" : "text-base"}`}>
					{props.children}
				</Text>
			</Pressable>
		);
	else if (props.soloBorde) {
		const colorClass =
			props.color === "gris"
				? "border-gray-400"
				: "border-slate-900";
		const textColor = props.color === "gris" ? "text-gray-400" : "text-slate-900";
		return (
			<Pressable
				onPress={props.disabled ? undefined : props.onClick}
				disabled={props.disabled}
				className={`${colorClass} border rounded ${props.chiquito ? "h-6 px-2" : "h-11 px-4"} items-center justify-center ${hover("hover:bg-gray-100")} ${interaccion(props.disabled)} ${props.className ?? ""}`}
			>
				<Text className={`${textColor} font-medium ${props.chiquito ? "text-xs" : "text-base"}`}>
					{props.children}
				</Text>
			</Pressable>
		);
	} else
		return (
			<Pressable
				onPress={props.disabled ? undefined : props.onClick}
				disabled={props.disabled}
				className={`bg-slate-900 rounded ${props.chiquito ? "py-1 px-2" : "py-3 px-4"} items-center justify-center ${hover("hover:bg-slate-700")} ${interaccion(props.disabled)} ${props.className ?? ""}`}
			>
				<Text className={`text-white font-semibold ${props.chiquito ? "text-xs" : "text-base"}`}>
					{props.children}
				</Text>
			</Pressable>
		);
};

export const BotonIcono = (props: Props) => {
	return (
		<Pressable
			onPress={props.disabled ? undefined : props.onClick}
			disabled={props.disabled}
			className={`bg-slate-900 rounded-full h-11 w-11 items-center justify-center ${props.disabled ? "" : "hover:bg-slate-700"} ${interaccion(props.disabled)} ${props.className ?? ""}`}
		>
			<View className="items-center justify-center">
				{props.children}
			</View>
		</Pressable>
	);
};
