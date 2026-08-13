export const generarKeyAPartirDeFecha = (fecha: Date) => {
	return fecha
		.toISOString()
		.replace(/[^0-9]/g, "")
		.slice(0, -3);
};

export const convertirEnKey = (txt: string) =>
	txt
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9 áéíóúÁÉÍÓÚ_]/gi, "")
		.replace(/ /g, "_");

export const fechaEsDeHaceMenosDe5Minutos = (fecha: Date): boolean => {
	const cincoMinutos = 1000 * 60 * 5;
	const horaHace5Minutos = Date.now() - cincoMinutos;

	return fecha > new Date(horaHace5Minutos);
};
