import { api } from "@/api/api";
import { CarpetaDTO } from "@/api/clients";
import { clavesCarpetas } from "@/api/query-keys";
import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { Input } from "@/components/ui/input-ui";
import useNavegacion from "@/use-navegacion";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export default function NuevaSubcarpeta() {
	const { irACarpeta, carpetaId } = useNavegacion();
	const [titulo, setTitulo] = useState("");
	const [creando, setCreando] = useState(false);
	const queryClient = useQueryClient();

	const carpetaPadreId = carpetaId ? Number(carpetaId) : undefined;

	const volver = () => {
		if (carpetaPadreId) irACarpeta(carpetaPadreId);
	};

	const crearYVolver = async () => {
		if (creando) return;
		if (titulo.trim() === "") {
			volver();
			return;
		}
		setCreando(true);
		try {
			await api.carpetaPOST(new CarpetaDTO({ titulo: titulo.trim(), carpetaPadreId }));
			await Promise.all(clavesCarpetas.map((k) => queryClient.invalidateQueries({ queryKey: k })));
			Toast.show({ type: "success", text1: `Subcarpeta '${titulo}' creada` });
			volver();
		} catch {
			Toast.show({ type: "error", text1: "Error al crear subcarpeta" });
			setCreando(false);
		}
	};

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={crearYVolver} disabled={creando}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
					Crear subcarpeta
				</Boton>
			</Encabezado>
			<Cuerpo>
				<Input value={titulo} onChange={setTitulo} placeholder="Nombre" />
			</Cuerpo>
		</View>
	);
}
