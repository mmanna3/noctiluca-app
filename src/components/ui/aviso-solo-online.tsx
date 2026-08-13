import { Text, View } from "react-native";

interface Props {
	className?: string;
	mensaje?: string;
}

const AvisoSoloOnline = ({
	className = "",
	mensaje = "Esta función requiere conexión a internet.",
}: Props) => (
	<View
		accessibilityRole="status"
		className={`bg-amber-50 border border-amber-200 rounded-md px-3 py-2 ${className}`}
	>
		<Text className="text-sm text-amber-800">{mensaje}</Text>
	</View>
);

export default AvisoSoloOnline;
