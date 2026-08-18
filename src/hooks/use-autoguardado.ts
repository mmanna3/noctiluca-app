import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { guardarEscritoLocal } from "@/sync/repositorio-escritos";

const DEBOUNCE_MS = 700;

interface EscritoEditable {
	clientId: string;
	titulo?: string;
	cuerpo?: string;
	carpetaClientId?: string;
	carpetaId?: number;
}

/**
 * Autoguardado offline-first: debouncea y persiste en SQLite (y encola el
 * upsert para el motor de sync) al perder foco de la app (AppState
 * inactive/background) y al desmontarse el componente.
 */
export const useAutoguardado = (escrito: EscritoEditable | undefined, titulo: string, cuerpo: string) => {
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const primeraCarga = useRef(true);
	const ultimoGuardado = useRef({ titulo: escrito?.titulo ?? "", cuerpo: escrito?.cuerpo ?? "" });

	const guardar = useCallback(async () => {
		if (!escrito?.clientId) return;
		if (titulo === ultimoGuardado.current.titulo && cuerpo === ultimoGuardado.current.cuerpo) return;
		ultimoGuardado.current = { titulo, cuerpo };
		await guardarEscritoLocal({
			clientId: escrito.clientId,
			titulo,
			cuerpo,
			carpetaClientId: escrito.carpetaClientId,
			carpetaId: escrito.carpetaId,
		});
	}, [escrito?.clientId, escrito?.carpetaClientId, escrito?.carpetaId, titulo, cuerpo]);

	const guardarRef = useRef(guardar);
	useEffect(() => {
		guardarRef.current = guardar;
	}, [guardar]);

	useEffect(() => {
		primeraCarga.current = true;
		ultimoGuardado.current = { titulo: escrito?.titulo ?? "", cuerpo: escrito?.cuerpo ?? "" };
	}, [escrito?.clientId]);

	useEffect(() => {
		if (!escrito?.clientId) return;
		if (primeraCarga.current) {
			primeraCarga.current = false;
			return;
		}
		clearTimeout(timer.current);
		timer.current = setTimeout(() => void guardarRef.current(), DEBOUNCE_MS);
		return () => clearTimeout(timer.current);
	}, [titulo, cuerpo, escrito?.clientId]);

	useEffect(() => {
		const flush = () => {
			clearTimeout(timer.current);
			void guardarRef.current();
		};
		const sub = AppState.addEventListener("change", (nextState) => {
			if (nextState === "inactive" || nextState === "background") flush();
		});
		return () => {
			sub.remove();
			flush();
		};
	}, []);

	const flush = useCallback(() => {
		clearTimeout(timer.current);
		return guardarRef.current();
	}, []);

	return { flush };
};
