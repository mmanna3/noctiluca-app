import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input-ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import {
	autenticarConBiometria,
	biometriaDisponible,
	guardarCredencialParaBiometria,
	hayCredencialGuardada,
	leerCredencialConBiometria,
} from "@/hooks/use-biometria";
import { registrarSesionTrasPassword } from "@/hooks/use-sesion-privada";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [mostrarFaceId, setMostrarFaceId] = useState(false);
	const router = useRouter();
	const userName = useAuth((s) => s.userName);

	useEffect(() => {
		const comprobar = async () => {
			const disponible = await biometriaDisponible();
			const hayCredencial = await hayCredencialGuardada();
			setMostrarFaceId(disponible && hayCredencial);
		};
		void comprobar();
	}, []);

	const entrarConPassword = async () => {
		setError("");
		setIsLoading(true);
		try {
			const success = await useAuth.getState().login("mana", password);
			if (success) {
				const usuario = userName ?? "mana";
				await Promise.all([
					registrarSesionTrasPassword(password, usuario),
					guardarCredencialParaBiometria(password),
				]);
				router.replace("/");
			} else {
				setError("Usuario o contraseña incorrectos");
			}
		} catch {
			setError("Error al intentar iniciar sesión");
		} finally {
			setIsLoading(false);
		}
	};

	const entrarConFaceId = async () => {
		setError("");
		setIsLoading(true);
		try {
			const autenticado = await autenticarConBiometria("Ingresar a Noctiluca");
			if (!autenticado) return;

			const passwordGuardado = await leerCredencialConBiometria();
			if (!passwordGuardado) {
				setError("No hay credencial guardada. Ingresá con contraseña.");
				return;
			}

			const success = await useAuth.getState().login("mana", passwordGuardado);
			if (success) {
				await registrarSesionTrasPassword(passwordGuardado, userName ?? "mana");
				router.replace("/");
			} else {
				setError("La sesión expiró. Ingresá con contraseña.");
			}
		} catch {
			setError("Error al autenticar con Face ID");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-gray-100">
			<View className="flex-1 items-center justify-center px-5">
				<Card className="w-[350px]">
					<CardContent>
						<View className="gap-4">
							{mostrarFaceId && (
								<TouchableOpacity
									onPress={entrarConFaceId}
									disabled={isLoading}
									className={`w-full bg-slate-900 h-12 px-4 rounded items-center justify-center flex-row gap-2 ${isLoading ? "opacity-50" : ""}`}
								>
									<Ionicons name="scan-outline" size={20} color="white" />
									<Text className="text-white text-sm font-medium">Entrar con Face ID</Text>
								</TouchableOpacity>
							)}

							<Input
								type="password"
								value={password}
								onChange={setPassword}
								placeholder="Contraseña"
								required
								disabled={isLoading}
							/>

							{error !== "" && (
								<Text className="text-sm text-red-500 text-center">{error}</Text>
							)}

							<TouchableOpacity
								onPress={entrarConPassword}
								disabled={isLoading}
								className={`w-full border border-slate-900 h-10 px-4 rounded items-center justify-center ${isLoading ? "opacity-50" : ""}`}
							>
								{isLoading ? <LoadingSpinner /> : <Text className="text-slate-900 text-sm font-medium">Entrar</Text>}
							</TouchableOpacity>
						</View>
					</CardContent>
				</Card>
			</View>
		</SafeAreaView>
	);
}
