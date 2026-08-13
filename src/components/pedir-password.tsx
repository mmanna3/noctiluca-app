import { api } from "@/api/api";
import { ValidarPasswordDTO } from "@/api/clients";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input-ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { registrarSesionTrasPassword, useSesionPrivada } from "@/hooks/use-sesion-privada";
import { etiquetaMotivoSesionPrivada, MotivoSesionPrivada } from "@/privacidad/privacidad-core";
import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import NetInfo from "@react-native-community/netinfo";

interface Props {
	motivo?: MotivoSesionPrivada;
	onDesbloqueado?: () => void;
	compacto?: boolean;
}

const PedirPassword = ({ motivo, onDesbloqueado, compacto = false }: Props) => {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const userName = useAuth((s) => s.userName);
	const { validarOffline, renovarSesion } = useSesionPrivada();
	const verificadorOffline = useSesionPrivada((s) => s.verificadorOffline);

	const handleSubmit = async () => {
		setError("");
		setIsLoading(true);

		try {
			const estado = await NetInfo.fetch();
			const online = estado.isConnected ?? false;
			const puedeValidarOffline = !!verificadorOffline;
			const userId = userName ?? "mana";

			if (online) {
				const dto = new ValidarPasswordDTO({ password });
				const response = await api.validarPassword(dto);
				if (response.exito) {
					await registrarSesionTrasPassword(password, userId);
					onDesbloqueado?.();
				} else {
					setError(response.error ?? "Contraseña incorrecta");
				}
			} else if (puedeValidarOffline) {
				const valido = await validarOffline(password, userId);
				if (valido) {
					renovarSesion();
					onDesbloqueado?.();
				} else {
					setError("Contraseña incorrecta");
				}
			} else {
				setError("Necesitás conexión para desbloquear por primera vez");
			}
		} catch {
			setError("Error al validar la contraseña");
		} finally {
			setIsLoading(false);
		}
	};

	const titulo = motivo ? etiquetaMotivoSesionPrivada(motivo) : "Contraseña requerida";

	return (
		<View
			className={
				compacto
					? "py-4"
					: "flex-1 items-center justify-center bg-transparent"
			}
		>
			<Card className={compacto ? "w-full border-gray-200" : "w-[350px]"}>
				<CardContent>
					<Text className="text-sm text-gray-600 mb-3 text-center">{titulo}</Text>
					<View className="gap-4">
						<Input
							type="password"
							value={password}
							onChange={setPassword}
							required
							disabled={isLoading}
						/>
						{error !== "" && (
							<Text className="text-sm text-red-500 text-center">{error}</Text>
						)}
						<TouchableOpacity
							onPress={handleSubmit}
							disabled={isLoading}
							className={`w-full border border-slate-900 h-10 px-4 rounded items-center justify-center ${isLoading ? "opacity-50" : ""}`}
						>
							{isLoading ? <LoadingSpinner /> : <Text className="text-slate-900 text-sm font-medium">!</Text>}
						</TouchableOpacity>
					</View>
				</CardContent>
			</Card>
		</View>
	);
};

export default PedirPassword;
