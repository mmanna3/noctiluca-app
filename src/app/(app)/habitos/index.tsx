import { Boton } from "@/components/ui/botones";
import Cuerpo from "@/components/ui/cuerpo";
import Encabezado from "@/components/ui/encabezado";
import { useAuth } from "@/hooks/use-auth";
import useNavegacion from "@/use-navegacion";
import { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Menú accedido desde el botón "/" del home. Antes duplicaba el tracker de
 * hábitos (ya está en el home) y tenía sus accesos sueltos arriba/abajo; ahora
 * es solo una lista de accesos rápidos como "pastillas".
 */
export default function MenuScreen() {
	const { irAlInicio, irAAdministrarHabitos, irAResumenHabitos, irANuevaCarpeta, irAPapelera, irALogin } =
		useNavegacion();

	const cerrarSesion = () => {
		useAuth.getState().logout();
		irALogin();
	};

	return (
		<View className="flex-1">
			<Encabezado>
				<Boton soloBorde onClick={irAlInicio}>
					<Ionicons name="chevron-back" size={16} color="#0f172a" />
				</Boton>
			</Encabezado>
			<Cuerpo className="flex-1">
				<PastillaAcceso
					icono={<Ionicons name="settings-outline" size={20} color="#0f172a" />}
					etiqueta="Hábitos"
					onClick={irAAdministrarHabitos}
				/>
				<PastillaAcceso
					icono={<Ionicons name="bar-chart-outline" size={20} color="#0f172a" />}
					etiqueta="Resumen Semanal"
					onClick={irAResumenHabitos}
				/>
				<PastillaAcceso
					icono={<Ionicons name="add" size={20} color="#0f172a" />}
					etiqueta="Nueva carpeta"
					onClick={irANuevaCarpeta}
				/>
				<PastillaAcceso
					icono={<Ionicons name="trash-outline" size={20} color="#0f172a" />}
					etiqueta="Tacho"
					onClick={irAPapelera}
				/>
				<PastillaAcceso
					icono={<Ionicons name="close" size={20} color="#0f172a" />}
					etiqueta="Cerrar sesión"
					onClick={cerrarSesion}
				/>
			</Cuerpo>
		</View>
	);
}

interface PastillaAccesoProps {
	icono: ReactNode;
	etiqueta: string;
	onClick: () => void;
}

function PastillaAcceso({ icono, etiqueta, onClick }: PastillaAccesoProps) {
	return (
		<TouchableOpacity
			onPress={onClick}
			className="flex-row items-center gap-3 px-4 py-3 mb-2 border border-gray-200 rounded-full"
		>
			{icono}
			<Text className="text-sm font-medium text-slate-900">{etiqueta}</Text>
		</TouchableOpacity>
	);
}
