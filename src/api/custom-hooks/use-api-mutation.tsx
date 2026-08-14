import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";

interface IProps<T> {
	fn: (args: T) => Promise<unknown>;
	mensajeDeExito?: string;
	antesDeMensajeExito?: () => void;
	despuesDeExito?: () => void;
	mensajeDeError?: string;
	invalidarQueries?: QueryKey[];
}

const useApiMutation = <T,>({
	fn,
	mensajeDeExito = "Operación exitosa",
	antesDeMensajeExito = () => undefined,
	despuesDeExito = () => undefined,
	mensajeDeError = "Ocurrió un error inesperado",
	invalidarQueries,
}: IProps<T>) => {
	"use no memo";
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (args: T) => {
			return fn(args);
		},
		onError: (error: unknown) => {
			console.error("Error en la mutación:", error);

			let mensaje = mensajeDeError;
			try {
				if (error instanceof Error) {
					const parsed = JSON.parse((error as unknown as { response: string }).response);
					mensaje = parsed.title ?? mensajeDeError;
				}
			} catch {
				// usar mensajeDeError por defecto
			}

			Toast.show({ type: "error", text1: mensaje });
		},
		onSuccess: async () => {
			if (invalidarQueries?.length) {
				await Promise.all(
					invalidarQueries.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
				);
			}
			antesDeMensajeExito();
			Toast.show({ type: "success", text1: mensajeDeExito });
			despuesDeExito();
		},
	});

	return mutation;
};

export default useApiMutation;
