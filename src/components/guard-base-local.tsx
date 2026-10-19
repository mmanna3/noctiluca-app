import { Boton } from "@/components/ui/botones";
import { iniciarCandadoBase, usarBaseAca } from "@/sync/apertura-base";
import { useCandadoBase } from "@/sync/candado-base-core";
import { ReactNode, useEffect } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/texto";

/**
 * En web, solo una pestaña puede usar la base local (ver `candado-base-core.ts`).
 * Las demás muestran este aviso en vez de la app. En iOS siempre deja pasar.
 */
export function GuardBaseLocal({ children }: { children: ReactNode }) {
	const estado = useCandadoBase((s) => s.estado);

	useEffect(() => {
		iniciarCandadoBase();
	}, []);

	if (estado === "duena") return <>{children}</>;
	if (estado === "verificando") return <View className="flex-1 bg-white" />;

	return (
		<View className="flex-1 bg-white items-center justify-center px-6">
			<View className="max-w-md w-full gap-4">
				{estado === "otra-pestana" && (
					<>
						<Text className="text-xl text-slate-900">Noctiluca está abierta en otra pestaña</Text>
						<Text className="text-base text-gray-500">
							Se puede usar en una sola pestaña a la vez. Cuando cierres la otra, esta se activa sola.
						</Text>
						<Boton onClick={usarBaseAca} className="self-start">
							Usar acá
						</Boton>
					</>
				)}
				{estado === "cedida" && (
					<Text className="text-xl text-slate-900">Noctiluca se abrió en otra pestaña…</Text>
				)}
				{estado === "error" && (
					<>
						<Text className="text-xl text-slate-900">No se pudo abrir la base local</Text>
						<Text className="text-base text-gray-500">
							Puede que siga abierta en otra pestaña. Cerrala y recargá esta página.
						</Text>
						<Boton onClick={() => window.location.reload()} className="self-start">
							Recargar
						</Boton>
					</>
				)}
			</View>
		</View>
	);
}
