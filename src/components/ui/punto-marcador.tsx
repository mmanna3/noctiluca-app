import { TouchableOpacity, View } from "react-native";

interface PuntoMarcadorVisualProps {
	marcado: boolean;
	className?: string;
}

export const PuntoMarcadorVisual = ({ marcado, className = "" }: PuntoMarcadorVisualProps) => (
	<View
		className={`h-5 w-5 rounded-full border-2 items-center justify-center shrink-0 ${
			marcado ? "bg-black border-black" : "border-gray-300"
		} ${className}`}
	/>
);

interface PuntoMarcadorProps {
	marcado: boolean;
	onClick: () => void;
	disabled?: boolean;
	"aria-label"?: string;
	className?: string;
}

const PuntoMarcador = ({
	marcado,
	onClick,
	disabled = false,
	className = "",
}: PuntoMarcadorProps) => (
	<TouchableOpacity
		onPress={onClick}
		disabled={disabled}
		className={`items-center justify-center ${className}`}
		accessibilityRole="checkbox"
		accessibilityState={{ checked: marcado }}
	>
		<PuntoMarcadorVisual marcado={marcado} />
	</TouchableOpacity>
);

export default PuntoMarcador;
