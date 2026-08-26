import ExpoModulesCore
import WidgetKit

// Debe coincidir exactamente con el grupo declarado en app.json (ios.entitlements)
// y con el que leen targets/widget/ObjetivosHoyWidget.swift y ObjetivosSemanaWidget.swift.
private let grupoCompartido = "group.com.mmanna3.noctiluca"
private let claveSnapshotHoy = "objetivosHoy"
private let claveSnapshotSemana = "objetivosSemana"

public class WidgetObjetivosModule: Module {
	public func definition() -> ModuleDefinition {
		Name("WidgetObjetivos")

		// `json` ya viene serializado desde JS con la forma
		// `{ items: [{ texto, completado }], actualizadoEn }` — este módulo no
		// conoce la forma de los datos de la app, solo los deja en el App Group
		// y le avisa a WidgetKit que se redibuje.
		Function("escribirSnapshotObjetivosHoy") { (json: String) in
			let defaults = UserDefaults(suiteName: grupoCompartido)
			defaults?.set(json, forKey: claveSnapshotHoy)
			WidgetCenter.shared.reloadAllTimelines()
		}

		Function("escribirSnapshotObjetivosSemana") { (json: String) in
			let defaults = UserDefaults(suiteName: grupoCompartido)
			defaults?.set(json, forKey: claveSnapshotSemana)
			WidgetCenter.shared.reloadAllTimelines()
		}
	}
}
