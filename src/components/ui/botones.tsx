import { ReactNode } from "react";
import { TouchableOpacity, Text, View } from "react-native";

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

export const Boton = (props: Props) => {
	const disabledClass = props.disabled ? "opacity-50" : "";

	if (props.sinBorde)
		return (
			<TouchableOpacity
				onPress={props.disabled ? undefined : props.onClick}
				disabled={props.disabled}
				className={`rounded ${props.chiquito ? "h-6 px-2" : "h-10 px-4"} items-center justify-center ${disabledClass} ${props.className ?? ""}`}
			>
				<Text className={`text-slate-900 font-medium ${props.chiquito ? "text-xs" : "text-sm"}`}>
					{props.children}
				</Text>
			</TouchableOpacity>
		);
	else if (props.soloBorde) {
		const colorClass =
			props.color === "gris"
				? "border-gray-400"
				: "border-slate-900";
		const textColor = props.color === "gris" ? "text-gray-400" : "text-slate-900";
		return (
			<TouchableOpacity
				onPress={props.disabled ? undefined : props.onClick}
				disabled={props.disabled}
				className={`${colorClass} border rounded ${props.chiquito ? "h-6 px-2" : "h-10 px-4"} items-center justify-center ${disabledClass} ${props.className ?? ""}`}
			>
				<Text className={`${textColor} font-medium ${props.chiquito ? "text-xs" : "text-sm"}`}>
					{props.children}
				</Text>
			</TouchableOpacity>
		);
	} else
		return (
			<TouchableOpacity
				onPress={props.disabled ? undefined : props.onClick}
				disabled={props.disabled}
				className={`bg-slate-900 rounded ${props.chiquito ? "py-1 px-2" : "py-2 px-4"} items-center justify-center ${disabledClass} ${props.className ?? ""}`}
			>
				<Text className={`text-white font-semibold ${props.chiquito ? "text-xs" : "text-sm"}`}>
					{props.children}
				</Text>
			</TouchableOpacity>
		);
};

export const BotonIcono = (props: Props) => {
	const disabledClass = props.disabled ? "opacity-50" : "";

	return (
		<TouchableOpacity
			onPress={props.disabled ? undefined : props.onClick}
			disabled={props.disabled}
			className={`bg-slate-900 rounded-full h-10 w-10 items-center justify-center ${disabledClass} ${props.className ?? ""}`}
		>
			<View className="items-center justify-center">
				{props.children}
			</View>
		</TouchableOpacity>
	);
};
