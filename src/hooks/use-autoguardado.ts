import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { api } from "@/api/api";
import { EscritoDTO } from "@/api/clients";

const DEBOUNCE_MS = 700;

interface EscritoEditable {
	id?: number;
	titulo?: string;
	cuerpo?: string;
	carpetaId?: number;
}

/**
 * Autoguardado para el editor online: debouncea y persiste vía PUT al perder
 * foco de la app (AppState inactive/background) y al desmontarse el componente.
 */
export const useAutoguardado = (escrito: EscritoEditable | undefined, titulo: string, cuerpo: string) => {
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const primeraCarga = useRef(true);
	const ultimoGuardado = useRef({ titulo: escrito?.titulo ?? "", cuerpo: escrito?.cuerpo ?? "" });

	const guardar = useCallback(async () => {
		if (!escrito?.id) return;
		if (titulo === ultimoGuardado.current.titulo && cuerpo === ultimoGuardado.current.cuerpo) return;
		ultimoGuardado.current = { titulo, cuerpo };
		await api.escritoPUT(
			escrito.id,
			new EscritoDTO({ titulo, cuerpo, carpetaId: escrito.carpetaId }),
		);
	}, [escrito?.id, escrito?.carpetaId, titulo, cuerpo]);

	const guardarRef = useRef(guardar);
	useEffect(() => {
		guardarRef.current = guardar;
	}, [guardar]);

	useEffect(() => {
		primeraCarga.current = true;
		ultimoGuardado.current = { titulo: escrito?.titulo ?? "", cuerpo: escrito?.cuerpo ?? "" };
	}, [escrito?.id]);

	useEffect(() => {
		if (!escrito?.id) return;
		if (primeraCarga.current) {
			primeraCarga.current = false;
			return;
		}
		clearTimeout(timer.current);
		timer.current = setTimeout(() => void guardarRef.current(), DEBOUNCE_MS);
		return () => clearTimeout(timer.current);
	}, [titulo, cuerpo, escrito?.id]);

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
