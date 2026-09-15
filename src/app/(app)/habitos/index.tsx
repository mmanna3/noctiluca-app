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
 * es una grilla de 2 columnas de accesos rápidos. El último (impar) queda
 * solo en su fila, ocupando la misma media columna que los demás (no todo el
 * ancho) gracias a `flex-wrap` + `justify-between`.
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
				<View className="flex-row flex-wrap justify-between">
					<PastillaAcceso
						icono={<Ionicons name="settings-outline" size={22} color="#0f172a" />}
						etiqueta="Hábitos"
						onClick={irAAdministrarHabitos}
					/>
					<PastillaAcceso
						icono={<Ionicons name="bar-chart-outline" size={22} color="#0f172a" />}
						etiqueta="Resumen Semanal"
						onClick={irAResumenHabitos}
					/>
					<PastillaAcceso
						icono={<Ionicons name="add" size={22} color="#0f172a" />}
						etiqueta="Nueva carpeta"
						onClick={irANuevaCarpeta}
					/>
					<PastillaAcceso
						icono={<Ionicons name="trash-outline" size={22} color="#0f172a" />}
						etiqueta="Tacho"
						onClick={irAPapelera}
					/>
					<PastillaAcceso
						icono={<Ionicons name="close" size={22} color="#0f172a" />}
						etiqueta="Cerrar sesión"
						onClick={cerrarSesion}
					/>
				</View>
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
			className="w-[48%] items-center justify-center gap-2 py-5 mb-3 border border-gray-200 rounded"
		>
			{icono}
			<Text className="text-sm font-medium text-slate-900 text-center">{etiqueta}</Text>
		</TouchableOpacity>
	);
}
