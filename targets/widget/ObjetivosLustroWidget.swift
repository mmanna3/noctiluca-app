import WidgetKit
import SwiftUI

// Mismo App Group y modelo (`ObjetivoHoyItem`) que ObjetivosHoyWidget.swift;
// clave de snapshot distinta (la escribe WidgetObjetivosModule.swift vía
// `escribirSnapshotObjetivosLustro`).
let claveSnapshotLustro = "objetivosLustro"

struct SnapshotObjetivosLustro: Codable {
	let items: [ObjetivoHoyItem]
	let actualizadoEn: String
}

/// Lee el snapshot del lustro que la app principal deja en el App Group.
/// Mismo esquema de solo-lectura que `ObjetivosHoyProvider` (ver ese archivo).
struct ObjetivosLustroProvider: TimelineProvider {
	func placeholder(in context: Context) -> ObjetivosLustroEntry {
		ObjetivosLustroEntry(date: .now, items: [
			ObjetivoHoyItem(texto: "Objetivo de ejemplo", completado: false),
		])
	}

	func getSnapshot(in context: Context, completion: @escaping (ObjetivosLustroEntry) -> Void) {
		completion(leerEntry())
	}

	func getTimeline(in context: Context, completion: @escaping (Timeline<ObjetivosLustroEntry>) -> Void) {
		let timeline = Timeline(entries: [leerEntry()], policy: .never)
		completion(timeline)
	}

	private func leerEntry() -> ObjetivosLustroEntry {
		guard
			let json = UserDefaults(suiteName: grupoCompartido)?.string(forKey: claveSnapshotLustro),
			let data = json.data(using: .utf8),
			let snapshot = try? JSONDecoder().decode(SnapshotObjetivosLustro.self, from: data)
		else {
			return ObjetivosLustroEntry(date: .now, items: [])
		}
		return ObjetivosLustroEntry(date: .now, items: snapshot.items)
	}
}

struct ObjetivosLustroEntry: TimelineEntry {
	let date: Date
	let items: [ObjetivoHoyItem]
}

struct ObjetivosLustroWidgetView: View {
	var entry: ObjetivosLustroProvider.Entry

	var body: some View {
		let pendientes = entry.items.filter { !$0.completado }

		VStack(alignment: .leading, spacing: 4) {
			Text("Objetivos del lustro")
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

struct ObjetivosLustroWidget: Widget {
	let kind: String = "ObjetivosLustroWidget"

	var body: some WidgetConfiguration {
		StaticConfiguration(kind: kind, provider: ObjetivosLustroProvider()) { entry in
			ObjetivosLustroWidgetView(entry: entry)
		}
		.configurationDisplayName("Objetivos del lustro")
		.description("Pendientes de los 5 años. Se actualiza cuando abrís Noctiluca.")
		.supportedFamilies([.systemSmall, .systemMedium])
	}
}

#Preview(as: .systemSmall) {
	ObjetivosLustroWidget()
} timeline: {
	ObjetivosLustroEntry(date: .now, items: [
		ObjetivoHoyItem(texto: "Mudarme a la costa", completado: false),
		ObjetivoHoyItem(texto: "Terminar la especialización", completado: true),
	])
}
