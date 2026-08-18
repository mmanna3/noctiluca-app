import ExpoModulesCore
import WidgetKit

// Debe coincidir exactamente con el grupo declarado en app.json (ios.entitlements)
// y con el que lee targets/widget/ObjetivosHoyWidget.swift.
private let grupoCompartido = "group.com.mmanna3.noctiluca"
private let claveSnapshot = "objetivosHoy"

public class WidgetObjetivosModule: Module {
	public func definition() -> ModuleDefinition {
		Name("WidgetObjetivos")

		// `json` ya viene serializado desde JS con la forma
		// `{ items: [{ texto, completado }], actualizadoEn }` — este módulo no
		// conoce la forma de los datos de la app, solo los deja en el App Group
		// y le avisa a WidgetKit que se redibuje.
		Function("escribirSnapshotObjetivosHoy") { (json: String) in
			let defaults = UserDefaults(suiteName: grupoCompartido)
			defaults?.set(json, forKey: claveSnapshot)
			WidgetCenter.shared.reloadAllTimelines()
		}
	}
}
