import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";

interface MarcadorSiNoProps {
	/** true = sí, false = no, undefined/null = sin marcar. */
	valor?: boolean | null;
	/** Recibe el nuevo valor; tocar la opción activa la desmarca (null). */
	onCambiar: (valor: boolean | null) => void;
	nombre?: string;
}

/**
 * Par de botones ✓ / ✗ para hábitos sí/no. Sin marcar, los dos quedan en
 * contorno; marcado, solo el elegido se rellena.
 */
const MarcadorSiNo = ({ valor, onCambiar, nombre }: MarcadorSiNoProps) => {
	const si = valor === true;
	const no = valor === false;
	return (
		<View className="flex-row items-center gap-2">
			<TouchableOpacity
				onPress={() => onCambiar(no ? null : false)}
				accessibilityRole="radio"
				accessibilityState={{ checked: no }}
				accessibilityLabel={nombre ? `${nombre}: no lo hice` : "No lo hice"}
				className={`h-7 w-7 rounded-full border items-center justify-center ${
					no ? "bg-rose-100 border-rose-400" : "border-gray-300 hover:bg-rose-50"
				}`}
			>
				<Ionicons name="close" size={16} color={no ? "#be123c" : "#9ca3af"} />
			</TouchableOpacity>
			<TouchableOpacity
				onPress={() => onCambiar(si ? null : true)}
				accessibilityRole="radio"
				accessibilityState={{ checked: si }}
				accessibilityLabel={nombre ? `${nombre}: lo hice` : "Lo hice"}
				className={`h-7 w-7 rounded-full border items-center justify-center ${
					si ? "bg-slate-900 border-slate-900" : "border-gray-300 hover:bg-slate-100"
				}`}
			>
				<Ionicons name="checkmark" size={16} color={si ? "#ffffff" : "#9ca3af"} />
			</TouchableOpacity>
		</View>
	);
};

export default MarcadorSiNo;
