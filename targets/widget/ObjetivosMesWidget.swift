import WidgetKit
import SwiftUI

// Mismo App Group y modelo (`ObjetivoHoyItem`) que ObjetivosHoyWidget.swift;
// clave de snapshot distinta (la escribe WidgetObjetivosModule.swift vía
// `escribirSnapshotObjetivosMes`).
let claveSnapshotMes = "objetivosMes"

struct SnapshotObjetivosMes: Codable {
	let items: [ObjetivoHoyItem]
	let actualizadoEn: String
}

/// Lee el snapshot del mes que la app principal deja en el App Group.
/// Mismo esquema de solo-lectura que `ObjetivosHoyProvider` (ver ese archivo).
struct ObjetivosMesProvider: TimelineProvider {
	func placeholder(in context: Context) -> ObjetivosMesEntry {
		ObjetivosMesEntry(date: .now, items: [
			ObjetivoHoyItem(texto: "Objetivo de ejemplo", completado: false),
		])
	}

	func getSnapshot(in context: Context, completion: @escaping (ObjetivosMesEntry) -> Void) {
		completion(leerEntry())
	}

	func getTimeline(in context: Context, completion: @escaping (Timeline<ObjetivosMesEntry>) -> Void) {
		let timeline = Timeline(entries: [leerEntry()], policy: .never)
		completion(timeline)
	}

	private func leerEntry() -> ObjetivosMesEntry {
		guard
			let json = UserDefaults(suiteName: grupoCompartido)?.string(forKey: claveSnapshotMes),
			let data = json.data(using: .utf8),
			let snapshot = try? JSONDecoder().decode(SnapshotObjetivosMes.self, from: data)
		else {
			return ObjetivosMesEntry(date: .now, items: [])
		}
		return ObjetivosMesEntry(date: .now, items: snapshot.items)
	}
}

struct ObjetivosMesEntry: TimelineEntry {
	let date: Date
	let items: [ObjetivoHoyItem]
}

struct ObjetivosMesWidgetView: View {
	var entry: ObjetivosMesProvider.Entry

	var body: some View {
		let pendientes = entry.items.filter { !$0.completado }

		VStack(alignment: .leading, spacing: 4) {
			Text("Objetivos del mes")
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

struct ObjetivosMesWidget: Widget {
	let kind: String = "ObjetivosMesWidget"

	var body: some WidgetConfiguration {
		StaticConfiguration(kind: kind, provider: ObjetivosMesProvider()) { entry in
			ObjetivosMesWidgetView(entry: entry)
		}
		.configurationDisplayName("Objetivos del mes")
		.description("Pendientes del mes. Se actualiza cuando abrís Noctiluca.")
		.supportedFamilies([.systemSmall, .systemMedium])
	}
}

#Preview(as: .systemSmall) {
	ObjetivosMesWidget()
} timeline: {
	ObjetivosMesEntry(date: .now, items: [
		ObjetivoHoyItem(texto: "Cerrar el trimestre", completado: false),
		ObjetivoHoyItem(texto: "Renovar la SUBE", completado: true),
	])
}
