import { DependencyList, useEffect, useState } from "react";
import { suscribirseACambios } from "./db";

/**
 * Lectura reactiva desde SQLite: ejecuta `query` al montar y cada vez que hay
 * una escritura local (ver `notificarCambio` en `db.ts`), o cuando cambian las
 * `deps`. Devuelve `undefined` hasta la primera resolución.
 *
 * No usa un ref para "la última query" (mutarlo durante el render generaba un
 * "Rendered fewer hooks than expected" con React Compiler habilitado): `deps`
 * ya describe todo lo que `query` necesita, así que el efecto puede cerrar
 * sobre la `query` de ese render sin problema.
 */
export function useLiveQuery<T>(query: () => Promise<T>, deps: DependencyList): T | undefined {
	const [resultado, setResultado] = useState<T | undefined>(undefined);

	useEffect(() => {
		let cancelado = false;
		const ejecutar = () => {
			void query().then((r) => {
				if (!cancelado) setResultado(r);
			});
		};
		ejecutar();
		const cancelar = suscribirseACambios(ejecutar);
		return () => {
			cancelado = true;
			cancelar();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);

	return resultado;
}
