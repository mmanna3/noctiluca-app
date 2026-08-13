import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { View } from "react-native";

interface RequiereAutenticacionProps {
	children: React.ReactNode;
}

export function RequiereAutenticacion({ children }: RequiereAutenticacionProps) {
	const hydrated = useAuth((s) => s.hydrated);
	const isAuthenticated = useAuth((s) => s.isAuthenticated);

	if (!hydrated) {
		return <View className="flex-1 bg-white" />;
	}

	if (!isAuthenticated) {
		return <Redirect href="/login" />;
	}

	return <>{children}</>;
}
