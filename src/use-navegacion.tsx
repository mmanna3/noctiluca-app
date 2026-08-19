import { useRouter, usePathname, useLocalSearchParams } from "expo-router";

const useNavegacion = () => {
	const router = useRouter();
	const pathname = usePathname();
	const { carpetaId, id, listaId } = useLocalSearchParams<{
		carpetaId?: string;
		id?: string;
		listaId?: string;
	}>();

	/**
	 * "Volver" real: hace pop de la pantalla actual (lo mismo que el gesto de
	 * swipe-back de iOS), en vez de reemplazarla por una instancia nueva de la
	 * pantalla de origen. Usar `replace` acá duplicaba entradas en el historial
	 * nativo y hacía que el gesto pareciera no hacer nada (volvía a una
	 * pantalla idéntica en vez de a la de abajo). Solo cae a `rutaSiNoHayHistorial`
	 * si la pantalla se abrió sin historial previo (ej. deep link directo).
	 */
	const volver = (rutaSiNoHayHistorial: Parameters<typeof router.replace>[0]) => {
		if (router.canGoBack()) router.back();
		else router.replace(rutaSiNoHayHistorial);
	};

	return {
		escritoId: id,
		carpetaId: carpetaId,
		listaId,
		irALogin: () => router.replace("/login"),
		irAlInicio: () => volver("/"),
		volver,
		verEscritosDeLaCarpeta: (cId: number | string) => router.push(`/${cId}/escritos`),
		volverAEscritosHome: (carpetaIdDestino?: string | number) => {
			const idCarpeta = carpetaIdDestino ?? carpetaId;
			volver(`/${idCarpeta}/escritos`);
		},
		irAVerEscrito: (escritoId: string, carpetaIdOverride?: string | number) => {
			const idCarpeta = carpetaIdOverride ?? carpetaId;
			if (pathname.includes("/papelera")) {
				router.push(`/papelera/ver/${escritoId}`);
			} else {
				router.push(`/${idCarpeta}/escritos/ver/${escritoId}`);
			}
		},
		volverAPapelera: () => volver("/papelera"),
		irANuevoEscrito: (carpetaIdDestino?: string | number) => {
			const idCarpeta = carpetaIdDestino ?? carpetaId;
			router.push(`/${idCarpeta}/nuevo`);
		},
		irACarpeta: (cId: number | string) => router.push(`/${cId}/escritos`),
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
