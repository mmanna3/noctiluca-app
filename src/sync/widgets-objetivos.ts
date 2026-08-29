import { actualizarWidgetObjetivosAnio } from "./widget-objetivos-anio";
import { actualizarWidgetObjetivosHoy } from "./widget-objetivos-hoy";
import { actualizarWidgetObjetivosLustro } from "./widget-objetivos-lustro";
import { actualizarWidgetObjetivosMes } from "./widget-objetivos-mes";
import { actualizarWidgetObjetivosSemana } from "./widget-objetivos-semana";

/**
 * Recalcula y reenvía los snapshots de todos los widgets de objetivos (hoy,
 * semana, mes, año, lustro). Se llama después de cualquier escritura de
 * objetivos y después de cada `pull()` exitoso — el widget no tiene red ni
 * SQLite propio, así que esta es la única forma en que se entera de cambios.
 * Cada `actualizar*` es best-effort y no-op sin módulo nativo (web).
 */
export const actualizarWidgetsObjetivos = (): void => {
	void actualizarWidgetObjetivosHoy();
	void actualizarWidgetObjetivosSemana();
	void actualizarWidgetObjetivosMes();
	void actualizarWidgetObjetivosAnio();
	void actualizarWidgetObjetivosLustro();
};
