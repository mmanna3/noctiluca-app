/**
 * Mock manual de `expo-sqlite` para tests: no hay módulo nativo disponible bajo
 * Jest. Implementa un almacén en memoria que entiende el subconjunto de SQL que
 * genera `src/sync/db.ts` (INSERT ... ON CONFLICT DO UPDATE, SELECT [cols] FROM
 * table [WHERE col = ? [AND col2 = ?]], SELECT COUNT(*), DELETE FROM table
 * [WHERE col = ?]) — suficiente para que los tests que importan `db.ts`
 * transitivamente no exploten al abrir la base.
 */

type Row = Record<string, unknown>;

const tablas = new Map<string, Map<string, Row>>();

const tabla = (nombre: string): Map<string, Row> => {
	if (!tablas.has(nombre)) tablas.set(nombre, new Map());
	return tablas.get(nombre)!;
};

const aplanar = (params: unknown[]): unknown[] =>
	params.length === 1 && Array.isArray(params[0]) ? (params[0] as unknown[]) : params;

class FakeDatabase {
	async execAsync(_sql: string): Promise<void> {
		// Los CREATE TABLE no son necesarios: el store en memoria no tiene schema.
	}

	async runAsync(sql: string, ...params: unknown[]): Promise<{ changes: number }> {
		const flat = aplanar(params);

		const insert = sql.match(/INSERT INTO (\w+)\s*\(([^)]+)\)/i);
		if (insert) {
			const [, nombreTabla, colsRaw] = insert;
			const cols = colsRaw.split(",").map((c) => c.trim());
			const fila: Row = {};
			cols.forEach((c, i) => (fila[c] = flat[i]));
			tabla(nombreTabla).set(String(fila[cols[0]]), fila);
			return { changes: 1 };
		}

		const del = sql.match(/DELETE FROM (\w+)(?:\s+WHERE\s+(\w+)\s*=\s*\?)?/i);
		if (del) {
			const [, nombreTabla, whereCol] = del;
			const t = tabla(nombreTabla);
			if (whereCol) {
				const valor = flat[0];
				for (const [clave, fila] of t) {
					if (String(fila[whereCol]) === String(valor)) t.delete(clave);
				}
			} else {
				t.clear();
			}
			return { changes: 1 };
		}

		return { changes: 0 };
	}

	async getAllAsync<T = Row>(sql: string, ...params: unknown[]): Promise<T[]> {
		return this.consultar(sql, params) as T[];
	}

	async getFirstAsync<T = Row>(sql: string, ...params: unknown[]): Promise<T | null> {
		return (this.consultar(sql, params)[0] as T) ?? null;
	}

	private consultar(sql: string, params: unknown[]): Row[] {
		const flat = aplanar(params);

		const count = sql.match(/SELECT COUNT\(\*\) as (\w+) FROM (\w+)/i);
		if (count) {
			const [, alias, nombreTabla] = count;
			let filas = [...tabla(nombreTabla).values()];
			const where = sql.match(/WHERE\s+(.+)$/i);
			if (where && /muerta IS NULL OR muerta = 0/i.test(where[1])) {
				filas = filas.filter((f) => f.muerta == null || f.muerta === 0);
			}
			return [{ [alias]: filas.length }];
		}

		const select = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)/i);
		if (!select) return [];
		const [, colsRaw, nombreTabla] = select;
		let filas = [...tabla(nombreTabla).values()];

		const where = sql.match(/WHERE\s+(.+)$/i);
		if (where) {
			const condiciones = where[1].split(/\s+AND\s+/i).map((c) => c.trim());
			let i = 0;
			for (const cond of condiciones) {
				const eq = cond.match(/(\w+)\s*=\s*\?/);
				if (eq) {
					const col = eq[1];
					const valor = flat[i++];
					filas = filas.filter((f) => String(f[col]) === String(valor));
				}
			}
		}

		if (colsRaw.trim() === "*") return filas;
		const cols = colsRaw.split(",").map((c) => c.trim());
		return filas.map((f) => {
			const proyeccion: Row = {};
			for (const c of cols) proyeccion[c] = f[c];
			return proyeccion;
		});
	}
}

export const openDatabaseAsync = async (_nombre: string): Promise<FakeDatabase> => new FakeDatabase();
