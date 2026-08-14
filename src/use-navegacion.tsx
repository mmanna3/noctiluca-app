import { useRouter, usePathname, useLocalSearchParams } from "expo-router";

const useNavegacion = () => {
	const router = useRouter();
	const pathname = usePathname();
	const { carpetaId, id, listaId } = useLocalSearchParams<{
		carpetaId?: string;
		id?: string;
		listaId?: string;
	}>();

	return {
		escritoId: id,
		carpetaId: carpetaId,
		listaId,
		irALogin: () => router.replace("/login"),
		irAlInicio: () => router.replace("/"),
		verEscritosDeLaCarpeta: (cId: number) => router.push(`/${cId}/escritos`),
		volverAEscritosHome: (carpetaIdDestino?: string | number) => {
			const idCarpeta = carpetaIdDestino ?? carpetaId;
			router.replace(`/${idCarpeta}/escritos`);
		},
		irAVerEscrito: (escritoId: string, carpetaIdOverride?: string | number) => {
			const idCarpeta = carpetaIdOverride ?? carpetaId;
			if (pathname.includes("/papelera")) {
				router.push(`/papelera/ver/${escritoId}`);
			} else {
				router.push(`/${idCarpeta}/escritos/ver/${escritoId}`);
			}
		},
		volverAPapelera: () => router.replace("/papelera"),
		irANuevoEscrito: (carpetaIdDestino?: string | number) => {
			const idCarpeta = carpetaIdDestino ?? carpetaId;
			router.push(`/${idCarpeta}/nuevo`);
		},
		irACarpeta: (cId: number) => router.push(`/${cId}/escritos`),
		irANuevaCarpeta: () => router.push("/nueva-carpeta"),
		irANuevaSubcarpeta: () => router.push(`/${carpetaId}/nueva-subcarpeta`),
		irAPapelera: () => router.push("/papelera"),
		irAModoLectura: () => router.push("/modo-lectura"),
		irAHabitos: () => router.push("/habitos"),
		irAResumenHabitos: () => router.push("/resumen-habitos"),
		irAListaObjetivos: (carpetaIdDestino: number, listaIdDestino: number) =>
			router.push(`/${carpetaIdDestino}/lista-objetivos/${listaIdDestino}`),
		irACarpetasPrivadas: () => router.push("/carpetas-privadas"),
		irAAdministrarHabitos: () => router.push("/administrar-habitos"),
		irABuscarEscritos: () => router.push("/buscar-escritos"),
		irAHistoricoObjetivos: (cId: number) => router.push(`/${cId}/historico-objetivos`),
	};
};

export default useNavegacion;
