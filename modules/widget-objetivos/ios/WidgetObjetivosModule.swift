import ExpoModulesCore
import WidgetKit

// Debe coincidir exactamente con el grupo declarado en app.json (ios.entitlements)
// y con el que leen los widgets en targets/widget/.
private let grupoCompartido = "group.com.mmanna3.noctiluca"
private let claveSnapshotHoy = "objetivosHoy"
private let claveSnapshotSemana = "objetivosSemana"
private let claveSnapshotMes = "objetivosMes"
private let claveSnapshotAnio = "objetivosAnio"
private let claveSnapshotLustro = "objetivosLustro"

public class WidgetObjetivosModule: Module {
	public func definition() -> ModuleDefinition {
		Name("WidgetObjetivos")

		// `json` ya viene serializado desde JS con la forma
		// `{ items: [{ texto, completado }], actualizadoEn }` — este módulo no
		// conoce la forma de los datos de la app, solo los deja en el App Group
		// y le avisa a WidgetKit que se redibuje.
		Function("escribirSnapshotObjetivosHoy") { (json: String) in
			escribirSnapshot(json, forKey: claveSnapshotHoy)
		}

		Function("escribirSnapshotObjetivosSemana") { (json: String) in
			escribirSnapshot(json, forKey: claveSnapshotSemana)
		}

		Function("escribirSnapshotObjetivosMes") { (json: String) in
			escribirSnapshot(json, forKey: claveSnapshotMes)
		}

		Function("escribirSnapshotObjetivosAnio") { (json: String) in
			escribirSnapshot(json, forKey: claveSnapshotAnio)
		}

		Function("escribirSnapshotObjetivosLustro") { (json: String) in
			escribirSnapshot(json, forKey: claveSnapshotLustro)
		}
	}
}

private func escribirSnapshot(_ json: String, forKey clave: String) {
	let defaults = UserDefaults(suiteName: grupoCompartido)
	defaults?.set(json, forKey: clave)
	WidgetCenter.shared.reloadAllTimelines()
}
