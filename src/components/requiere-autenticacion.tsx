import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/use-auth";

interface RequiereAutenticacionProps {
	children: React.ReactNode;
}

export function RequiereAutenticacion({ children }: RequiereAutenticacionProps) {
	const { isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return <Redirect href="/login" />;
	}

	return <>{children}</>;
}
