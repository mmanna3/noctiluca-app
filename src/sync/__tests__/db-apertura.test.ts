const mockAbrir = jest.fn();
const mockPreparar = jest.fn();
const mockReportarFallo = jest.fn();

jest.mock("expo-sqlite", () => ({ openDatabaseAsync: (...args: unknown[]) => mockAbrir(...args) }));
jest.mock("../apertura-base", () => ({
	prepararApertura: () => mockPreparar(),
	reportarFalloApertura: (e: unknown) => mockReportarFallo(e),
}));

const dbFalsa = () => ({
	execAsync: jest.fn(async () => {}),
	getFirstAsync: jest.fn(async () => ({ total: 3 })),
});

const cargarDb = () => {
	let modulo!: typeof import("../db");
	jest.isolateModules(() => {
		modulo = require("../db");
	});
	return modulo;
};

beforeEach(() => {
	mockAbrir.mockReset();
	mockPreparar.mockReset().mockResolvedValue(undefined);
	mockReportarFallo.mockReset();
});

describe("apertura de la base local", () => {
	test("abre una sola vez aunque haya lecturas en paralelo", async () => {
		mockAbrir.mockResolvedValue(dbFalsa());
		const { outboxDb } = cargarDb();
		await Promise.all([outboxDb.contarActivas(), outboxDb.contarActivas(), outboxDb.contarActivas()]);
		expect(mockAbrir).toHaveBeenCalledTimes(1);
		expect(mockPreparar).toHaveBeenCalledTimes(1);
	});

	test("si falla al abrir, avisa y la próxima lectura vuelve a intentar", async () => {
		const error = Object.assign(new Error("Access Handles cannot be created"), { name: "NoModificationAllowedError" });
		mockAbrir.mockRejectedValueOnce(error).mockResolvedValueOnce(dbFalsa());
		const { outboxDb } = cargarDb();

		await expect(outboxDb.contarActivas()).rejects.toBe(error);
		expect(mockReportarFallo).toHaveBeenCalledWith(error);

		await expect(outboxDb.contarActivas()).resolves.toBe(3);
		expect(mockAbrir).toHaveBeenCalledTimes(2);
	});

	test("no abre hasta que termina prepararApertura (ser dueña y OPFS libre)", async () => {
		let liberar!: () => void;
		mockPreparar.mockReturnValue(new Promise<void>((r) => (liberar = r)));
		mockAbrir.mockResolvedValue(dbFalsa());
		const { outboxDb } = cargarDb();

		const lectura = outboxDb.contarActivas();
		await new Promise((r) => setTimeout(r, 0));
		expect(mockAbrir).not.toHaveBeenCalled();

		liberar();
		await expect(lectura).resolves.toBe(3);
		expect(mockAbrir).toHaveBeenCalledTimes(1);
	});
});
