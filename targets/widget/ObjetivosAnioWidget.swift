import WidgetKit
import SwiftUI

// Mismo App Group y modelo (`ObjetivoHoyItem`) que ObjetivosHoyWidget.swift;
// clave de snapshot distinta (la escribe WidgetObjetivosModule.swift vía
// `escribirSnapshotObjetivosAnio`).
let claveSnapshotAnio = "objetivosAnio"

struct SnapshotObjetivosAnio: Codable {
	let items: [ObjetivoHoyItem]
	let actualizadoEn: String
}

/// Lee el snapshot del año que la app principal deja en el App Group.
/// Mismo esquema de solo-lectura que `ObjetivosHoyProvider` (ver ese archivo).
struct ObjetivosAnioProvider: TimelineProvider {
	func placeholder(in context: Context) -> ObjetivosAnioEntry {
		ObjetivosAnioEntry(date: .now, items: [
			ObjetivoHoyItem(texto: "Objetivo de ejemplo", completado: false),
		])
	}

	func getSnapshot(in context: Context, completion: @escaping (ObjetivosAnioEntry) -> Void) {
		completion(leerEntry())
	}

	func getTimeline(in context: Context, completion: @escaping (Timeline<ObjetivosAnioEntry>) -> Void) {
		let timeline = Timeline(entries: [leerEntry()], policy: .never)
		completion(timeline)
	}

	private func leerEntry() -> ObjetivosAnioEntry {
		guard
			let json = UserDefaults(suiteName: grupoCompartido)?.string(forKey: claveSnapshotAnio),
			let data = json.data(using: .utf8),
			let snapshot = try? JSONDecoder().decode(SnapshotObjetivosAnio.self, from: data)
		else {
			return ObjetivosAnioEntry(date: .now, items: [])
		}
		return ObjetivosAnioEntry(date: .now, items: snapshot.items)
	}
}

struct ObjetivosAnioEntry: TimelineEntry {
	let date: Date
	let items: [ObjetivoHoyItem]
}

struct ObjetivosAnioWidgetView: View {
	var entry: ObjetivosAnioProvider.Entry

	var body: some View {
		let pendientes = entry.items.filter { !$0.completado }

		VStack(alignment: .leading, spacing: 4) {
			Text("Objetivos del año")
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

struct ObjetivosAnioWidget: Widget {
	let kind: String = "ObjetivosAnioWidget"

	var body: some WidgetConfiguration {
		StaticConfiguration(kind: kind, provider: ObjetivosAnioProvider()) { entry in
			ObjetivosAnioWidgetView(entry: entry)
		}
		.configurationDisplayName("Objetivos del año")
		.description("Pendientes del año. Se actualiza cuando abrís Noctiluca.")
		.supportedFamilies([.systemSmall, .systemMedium])
	}
}

#Preview(as: .systemSmall) {
	ObjetivosAnioWidget()
} timeline: {
	ObjetivosAnioEntry(date: .now, items: [
		ObjetivoHoyItem(texto: "Aprender a nadar de espalda", completado: false),
		ObjetivoHoyItem(texto: "Leer 12 libros", completado: true),
	])
}
