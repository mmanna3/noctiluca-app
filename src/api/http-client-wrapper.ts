import Toast from "react-native-toast-message";
import { router } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { useEstadoSync } from "@/sync/estado-sync";

export class HttpClientWrapper {
	private publicRoutes = ["/api/Auth/login", "/api/Publico"];

	fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
		const token = useAuth.getState().token;
		const isPublicRoute = this.isPublicRoute(url.toString());

		if (token && !isPublicRoute) {
			if (!init) {
				init = {};
			}
			if (!init.headers) {
				init.headers = {};
			}

			const headers =
				init.headers instanceof Headers
					? Object.fromEntries(init.headers.entries())
					: (init.headers as Record<string, string>);

			init.headers = {
				...headers,
				Authorization: `Bearer ${token}`,
			};
		}

		const { incrementarSolicitudes, decrementarSolicitudes } = useEstadoSync.getState();
		incrementarSolicitudes();
		return fetch(url as RequestInfo, init)
			.then(async (response) => {
				decrementarSolicitudes();
				if (response.status === 401 && !isPublicRoute) {
					useAuth.getState().logout();
					Toast.show({ type: "error", text1: "Token vencido" });
					router.replace("/login");
					throw new Error("Token vencido");
				} else if (response.status === 403 && !isPublicRoute) {
					useAuth.getState().logout();
					Toast.show({ type: "error", text1: "Usuario no tiene permisos" });
					router.replace("/login");
					throw new Error("Usuario no tiene permisos");
				}
				return response;
			})
			.catch((error) => {
				decrementarSolicitudes();
				throw error;
			});
	}

	private isPublicRoute(url: string): boolean {
		return this.publicRoutes.some((route) => url.includes(route));
	}
}
