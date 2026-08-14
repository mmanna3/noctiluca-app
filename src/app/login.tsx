import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input-ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { registrarSesionTrasPassword } from "@/hooks/use-sesion-privada";
import { useRouter } from "expo-router";
import { useState } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const userName = useAuth((s) => s.userName);

	const handleSubmit = async () => {
		setError("");
		setIsLoading(true);
		try {
			const success = await useAuth.getState().login("mana", password);
			if (success) {
				await registrarSesionTrasPassword(password, userName ?? "mana");
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

	return (
		<SafeAreaView className="flex-1 bg-gray-100">
			<View className="flex-1 items-center justify-center px-5">
				<Card className="w-[350px]">
					<CardContent>
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
		</SafeAreaView>
	);
}
