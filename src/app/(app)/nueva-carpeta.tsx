import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { Input } from "@/components/ui/input-ui";
import useNavegacion from "@/use-navegacion";
import { useCarpeta } from "@/sync/lecturas";
import { crearCarpetaLocal } from "@/sync/repositorio-carpetas";
import { useState } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export default function NuevaCarpeta() {
	const { irAlInicio, volver: volverNav, carpetaId } = useNavegacion();
	const [titulo, setTitulo] = useState("");
	const [creando, setCreando] = useState(false);

	const esSubcarpeta = !!carpetaId;
	const padre = useCarpeta(carpetaId);

	const volverAlOrigen = () => {
		if (esSubcarpeta && carpetaId) volverNav(`/${carpetaId}/escritos`);
		else irAlInicio();
	};

	const crearYVolver = async () => {
		if (creando) return;
		if (titulo.trim() === "") {
			volverAlOrigen();
			return;
		}
		setCreando(true);
		await crearCarpetaLocal({
			titulo: titulo.trim(),
			carpetaPadreId: padre?.id,
			carpetaPadreClientId: padre?.clientId,
		});
		Toast.show({
			type: "success",
			text1: esSubcarpeta ? `Subcarpeta '${titulo}' creada` : `Carpeta '${titulo}' creada`,
		});
		volverAlOrigen();
	};

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={crearYVolver} disabled={creando}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					{esSubcarpeta ? " Crear subcarpeta" : " Crear carpeta"}
				</Boton>
			</Encabezado>
			<Cuerpo>
				<Input
					value={titulo}
					onChange={setTitulo}
				/>
			</Cuerpo>
		</View>
	);
}
