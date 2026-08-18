import WidgetKit
import SwiftUI

// Debe coincidir exactamente con el grupo declarado en app.json (ios.entitlements)
// y con el que usa modules/widget-objetivos/ios/WidgetObjetivosModule.swift.
let grupoCompartido = "group.com.mmanna3.noctiluca"
let claveSnapshot = "objetivosHoy"

struct ObjetivoHoyItem: Codable {
	let texto: String
	let completado: Bool
}

struct SnapshotObjetivosHoy: Codable {
	let items: [ObjetivoHoyItem]
	let actualizadoEn: String
}

/// Lee el snapshot que la app principal deja en el App Group. Solo lectura:
/// no hay red ni SQLite compartido, y el widget nunca escribe — se actualiza
/// cuando la app llama a `WidgetCenter.shared.reloadAllTimelines()` (ver
/// `WidgetObjetivosModule.swift`), no en background.
struct ObjetivosHoyProvider: TimelineProvider {
	func placeholder(in context: Context) -> ObjetivosHoyEntry {
		ObjetivosHoyEntry(date: .now, items: [
			ObjetivoHoyItem(texto: "Objetivo de ejemplo", completado: false),
		])
	}

	func getSnapshot(in context: Context, completion: @escaping (ObjetivosHoyEntry) -> Void) {
		completion(leerEntry())
	}

	func getTimeline(in context: Context, completion: @escaping (Timeline<ObjetivosHoyEntry>) -> Void) {
		let timeline = Timeline(entries: [leerEntry()], policy: .never)
		completion(timeline)
	}

	private func leerEntry() -> ObjetivosHoyEntry {
		guard
			let json = UserDefaults(suiteName: grupoCompartido)?.string(forKey: claveSnapshot),
			let data = json.data(using: .utf8),
			let snapshot = try? JSONDecoder().decode(SnapshotObjetivosHoy.self, from: data)
		else {
			return ObjetivosHoyEntry(date: .now, items: [])
		}
		return ObjetivosHoyEntry(date: .now, items: snapshot.items)
	}
}

struct ObjetivosHoyEntry: TimelineEntry {
	let date: Date
	let items: [ObjetivoHoyItem]
}

struct ObjetivosHoyWidgetView: View {
	var entry: ObjetivosHoyProvider.Entry

	var body: some View {
		let pendientes = entry.items.filter { !$0.completado }

		VStack(alignment: .leading, spacing: 4) {
			Text("Objetivos de hoy")
				.font(.caption)
				.foregroundStyle(.secondary)

			if entry.items.isEmpty {
				Text("Sin objetivos")
					.font(.subheadline)
					.foregroundStyle(.secondary)
			} else if pendientes.isEmpty {
				Text("Todo listo ✓")
					.font(.subheadline)
			} else {
				ForEach(pendientes.prefix(4), id: \.texto) { item in
					HStack(alignment: .top, spacing: 6) {
						Image(systemName: "circle")
							.font(.caption2)
						Text(item.texto)
							.font(.subheadline)
							.lineLimit(1)
					}
				}
				if pendientes.count > 4 {
					Text("+\(pendientes.count - 4) más")
						.font(.caption2)
						.foregroundStyle(.secondary)
				}
			}
		}
		.frame(maxWidth: .infinity, alignment: .leading)
		.containerBackground(.background, for: .widget)
	}
}

struct ObjetivosHoyWidget: Widget {
	let kind: String = "ObjetivosHoyWidget"

	var body: some WidgetConfiguration {
		StaticConfiguration(kind: kind, provider: ObjetivosHoyProvider()) { entry in
			ObjetivosHoyWidgetView(entry: entry)
		}
		.configurationDisplayName("Objetivos de hoy")
		.description("Pendientes del día. Se actualiza cuando abrís Noctiluca.")
		.supportedFamilies([.systemSmall, .systemMedium])
	}
}

#Preview(as: .systemSmall) {
	ObjetivosHoyWidget()
} timeline: {
	ObjetivosHoyEntry(date: .now, items: [
		ObjetivoHoyItem(texto: "Escribir el resumen semanal", completado: false),
		ObjetivoHoyItem(texto: "Llamar al dentista", completado: true),
	])
}
