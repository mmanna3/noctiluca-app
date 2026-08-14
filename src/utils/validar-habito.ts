export const validarHabito = (nombre: string): string => {
	if (!nombre.trim()) return "El nombre es obligatorio";
	if (nombre.trim().length > 50) return "Máximo 50 caracteres";
	return "";
};
