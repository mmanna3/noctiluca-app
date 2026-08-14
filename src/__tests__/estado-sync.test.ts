import { useEstadoSync, recalcularEstado } from "@/sync/estado-sync";

beforeEach(() => {
	useEstadoSync.setState({
		estado: "guardado",
		pendientes: 0,
		online: true,
		sincronizando: false,
		syncInicialCompleto: true,
		ultimoError: undefined,
	});
});

describe("useEstadoSync", () => {
	it("estado inicial correcto", () => {
		const s = useEstadoSync.getState();
		expect(s.online).toBe(true);
		expect(s.pendientes).toBe(0);
		expect(s.sincronizando).toBe(false);
	});

	it("setOnline actualiza online", () => {
		useEstadoSync.getState().setOnline(false);
		expect(useEstadoSync.getState().online).toBe(false);
	});

	it("setPendientes actualiza pendientes", () => {
		useEstadoSync.getState().setPendientes(5);
		expect(useEstadoSync.getState().pendientes).toBe(5);
	});

	it("setError marca estado error", () => {
		useEstadoSync.getState().setError("fallo");
		const s = useEstadoSync.getState();
		expect(s.estado).toBe("error");
		expect(s.ultimoError).toBe("fallo");
	});

	it("setError sin mensaje vuelve a guardado", () => {
		useEstadoSync.getState().setError(undefined);
		expect(useEstadoSync.getState().estado).toBe("guardado");
	});
});

describe("recalcularEstado", () => {
	it("0 pendientes → guardado", () => {
		expect(recalcularEstado(0, true)).toBe("guardado");
	});

	it("pendientes sin conexión → sin-conexion", () => {
		expect(recalcularEstado(3, false)).toBe("sin-conexion");
	});

	it("pendientes online → guardando", () => {
		expect(recalcularEstado(2, true)).toBe("guardando");
	});
});
