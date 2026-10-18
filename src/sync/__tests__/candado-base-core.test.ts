import { crearCandado, EstadoCandado, GestorLocks, reintentarHasta } from "../candado-base-core";

/**
 * Imitación de `navigator.locks` (exclusivo, un solo nombre), compartida entre
 * "pestañas": respeta la cola, `ifAvailable`, `steal` y `signal`.
 */
class LocksFalsos {
	private duena?: { soltar: () => void; rechazar: (e: Error) => void };
	private cola: { conceder: () => void; signal?: AbortSignal }[] = [];

	gestor(): GestorLocks {
		return {
			request: (_nombre, opciones, callback) =>
				new Promise((resolver, rechazar) => {
					const conceder = () => {
						let soltado = false;
						const soltar = () => {
							if (soltado) return;
							soltado = true;
							this.duena = undefined;
							this.siguiente();
						};
						this.duena = { soltar, rechazar };
						Promise.resolve(callback({ nombre: "noctiluca-db" })).then(
							(v) => {
								soltar();
								resolver(v);
							},
							(e) => {
								soltar();
								rechazar(e);
							},
						);
					};

					if (opciones.steal) {
						const anterior = this.duena;
						this.duena = undefined;
						anterior?.rechazar(abortError());
						conceder();
						return;
					}
					if (this.duena) {
						if (opciones.ifAvailable) {
							Promise.resolve(callback(null)).then(resolver, rechazar);
							return;
						}
						const entrada = { conceder, signal: opciones.signal };
						this.cola.push(entrada);
						opciones.signal?.addEventListener("abort", () => {
							const i = this.cola.indexOf(entrada);
							if (i >= 0) {
								this.cola.splice(i, 1);
								rechazar(abortError());
							}
						});
						return;
					}
					conceder();
				}),
		};
	}

	/** Simula que la pestaña dueña se cerró. */
	cerrarDuena() {
		this.duena?.soltar();
	}

	private siguiente() {
		const proxima = this.cola.shift();
		proxima?.conceder();
	}
}

const abortError = () => Object.assign(new Error("abortado"), { name: "AbortError" });
const tick = () => new Promise((r) => setTimeout(r, 0));

const crearPestana = (locks: LocksFalsos | undefined) => {
	const estados: EstadoCandado[] = [];
	const alPerder = jest.fn();
	const candado = crearCandado({ locks: locks?.gestor(), setEstado: (e) => estados.push(e), alPerder });
	let esDuena = false;
	void candado.esperarSerDuena().then(() => (esDuena = true));
	return { candado, estados, alPerder, ultimo: () => estados[estados.length - 1], esDuena: () => esDuena };
};

describe("candado de la base local", () => {
	test("la primera pestaña es la dueña", async () => {
		const locks = new LocksFalsos();
		const a = crearPestana(locks);
		await a.candado.iniciar();
		await tick();
		expect(a.ultimo()).toBe("duena");
		expect(a.esDuena()).toBe(true);
	});

	test("la segunda pestaña avisa y no es dueña", async () => {
		const locks = new LocksFalsos();
		const a = crearPestana(locks);
		const b = crearPestana(locks);
		await a.candado.iniciar();
		await b.candado.iniciar();
		await tick();
		expect(b.ultimo()).toBe("otra-pestana");
		expect(b.esDuena()).toBe(false);
		expect(a.ultimo()).toBe("duena");
	});

	test("al cerrarse la dueña, la que esperaba se activa sola", async () => {
		const locks = new LocksFalsos();
		const a = crearPestana(locks);
		const b = crearPestana(locks);
		await a.candado.iniciar();
		await b.candado.iniciar();
		locks.cerrarDuena();
		await tick();
		expect(b.ultimo()).toBe("duena");
		expect(b.esDuena()).toBe(true);
	});

	test("con tres pestañas se activan de a una, en orden", async () => {
		const locks = new LocksFalsos();
		const [a, b, c] = [crearPestana(locks), crearPestana(locks), crearPestana(locks)];
		await a.candado.iniciar();
		await b.candado.iniciar();
		await c.candado.iniciar();
		locks.cerrarDuena();
		await tick();
		expect(b.ultimo()).toBe("duena");
		expect(c.ultimo()).toBe("otra-pestana");
		locks.cerrarDuena();
		await tick();
		expect(c.ultimo()).toBe("duena");
	});

	test("'Usar acá' le saca la base a la dueña, que la suelta", async () => {
		const locks = new LocksFalsos();
		const a = crearPestana(locks);
		const b = crearPestana(locks);
		await a.candado.iniciar();
		await b.candado.iniciar();
		b.candado.usarAca();
		await tick();
		expect(b.ultimo()).toBe("duena");
		expect(b.esDuena()).toBe(true);
		expect(a.ultimo()).toBe("cedida");
		expect(a.alPerder).toHaveBeenCalledTimes(1);
	});

	test("después de 'Usar acá', la espera en la cola se cancela (no queda dueña dos veces)", async () => {
		const locks = new LocksFalsos();
		const a = crearPestana(locks);
		const b = crearPestana(locks);
		await a.candado.iniciar();
		await b.candado.iniciar();
		b.candado.usarAca();
		await tick();
		// La pestaña A se recarga y vuelve a pedir: tiene que quedar avisando.
		const aRecargada = crearPestana(locks);
		await aRecargada.candado.iniciar();
		await tick();
		expect(aRecargada.ultimo()).toBe("otra-pestana");
		expect(b.alPerder).not.toHaveBeenCalled();
		expect(b.ultimo()).toBe("duena");
	});

	test("ida y vuelta: A le roba a B y B a A", async () => {
		const locks = new LocksFalsos();
		const a = crearPestana(locks);
		const b = crearPestana(locks);
		await a.candado.iniciar();
		await b.candado.iniciar();
		b.candado.usarAca();
		await tick();
		const a2 = crearPestana(locks); // A recargada
		await a2.candado.iniciar();
		a2.candado.usarAca();
		await tick();
		expect(a2.ultimo()).toBe("duena");
		expect(b.ultimo()).toBe("cedida");
		expect(b.alPerder).toHaveBeenCalledTimes(1);
	});

	test("'Usar acá' siendo dueña no hace nada", async () => {
		const locks = new LocksFalsos();
		const a = crearPestana(locks);
		await a.candado.iniciar();
		a.candado.usarAca();
		await tick();
		expect(a.alPerder).not.toHaveBeenCalled();
		expect(a.ultimo()).toBe("duena");
	});

	test("sin Web Locks, se asume una sola pestaña", async () => {
		const a = crearPestana(undefined);
		await a.candado.iniciar();
		await tick();
		expect(a.ultimo()).toBe("duena");
		expect(a.esDuena()).toBe(true);
	});
});

describe("reintentarHasta", () => {
	const reloj = () => {
		let t = 0;
		const esperas: number[] = [];
		return {
			ahora: () => t,
			dormir: async (ms: number) => {
				esperas.push(ms);
				t += ms;
			},
			esperas,
		};
	};

	test("si ya está libre no espera", async () => {
		const r = reloj();
		const probar = jest.fn(async () => true);
		expect(await reintentarHasta(probar, { maxMs: 1000, ...r })).toBe(true);
		expect(probar).toHaveBeenCalledTimes(1);
		expect(r.esperas).toEqual([]);
	});

	test("reintenta con espera creciente hasta que se libera", async () => {
		const r = reloj();
		let intentos = 0;
		const probar = async () => ++intentos >= 4;
		expect(await reintentarHasta(probar, { maxMs: 15000, ...r })).toBe(true);
		expect(r.esperas).toEqual([50, 100, 200]);
	});

	test("la espera no pasa de 1 segundo", async () => {
		const r = reloj();
		let intentos = 0;
		await reintentarHasta(async () => ++intentos >= 10, { maxMs: 15000, ...r });
		expect(Math.max(...r.esperas)).toBe(1000);
	});

	test("se rinde al pasar el máximo", async () => {
		const r = reloj();
		const probar = jest.fn(async () => false);
		expect(await reintentarHasta(probar, { maxMs: 3000, ...r })).toBe(false);
		expect(r.ahora()).toBeGreaterThanOrEqual(3000);
		expect(r.ahora()).toBeLessThan(5000);
	});
});
