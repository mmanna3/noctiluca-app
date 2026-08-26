import WidgetKit
import SwiftUI

// Mismo App Group que ObjetivosHoyWidget.swift; clave de snapshot distinta
// (la escribe WidgetObjetivosModule.swift vía `escribirSnapshotObjetivosSemana`).
let claveSnapshotSemana = "objetivosSemana"

struct SnapshotObjetivosSemana: Codable {
	let items: [ObjetivoHoyItem]
	let actualizadoEn: String
}

/// Lee el snapshot de la semana que la app principal deja en el App Group.
/// Mismo esquema de solo-lectura que `ObjetivosHoyProvider` (ver ese archivo).
struct ObjetivosSemanaProvider: TimelineProvider {
	func placeholder(in context: Context) -> ObjetivosSemanaEntry {
		ObjetivosSemanaEntry(date: .now, items: [
			ObjetivoHoyItem(texto: "Objetivo de ejemplo", completado: false),
		])
	}

	func getSnapshot(in context: Context, completion: @escaping (ObjetivosSemanaEntry) -> Void) {
		completion(leerEntry())
	}

	func getTimeline(in context: Context, completion: @escaping (Timeline<ObjetivosSemanaEntry>) -> Void) {
		let timeline = Timeline(entries: [leerEntry()], policy: .never)
		completion(timeline)
	}

	private func leerEntry() -> ObjetivosSemanaEntry {
		guard
			let json = UserDefaults(suiteName: grupoCompartido)?.string(forKey: claveSnapshotSemana),
			let data = json.data(using: .utf8),
			let snapshot = try? JSONDecoder().decode(SnapshotObjetivosSemana.self, from: data)
		else {
			return ObjetivosSemanaEntry(date: .now, items: [])
		}
		return ObjetivosSemanaEntry(date: .now, items: snapshot.items)
	}
}

struct ObjetivosSemanaEntry: TimelineEntry {
	let date: Date
	let items: [ObjetivoHoyItem]
}

struct ObjetivosSemanaWidgetView: View {
	var entry: ObjetivosSemanaProvider.Entry

	var body: some View {
		let pendientes = entry.items.filter { !$0.completado }

		VStack(alignment: .leading, spacing: 4) {
			Text("Objetivos de la semana")
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

struct ObjetivosSemanaWidget: Widget {
	let kind: String = "ObjetivosSemanaWidget"

	var body: some WidgetConfiguration {
		StaticConfiguration(kind: kind, provider: ObjetivosSemanaProvider()) { entry in
			ObjetivosSemanaWidgetView(entry: entry)
		}
		.configurationDisplayName("Objetivos de la semana")
		.description("Pendientes de la semana. Se actualiza cuando abrís Noctiluca.")
		.supportedFamilies([.systemSmall, .systemMedium])
	}
}

#Preview(as: .systemSmall) {
	ObjetivosSemanaWidget()
} timeline: {
	ObjetivosSemanaEntry(date: .now, items: [
		ObjetivoHoyItem(texto: "Escribir el resumen semanal", completado: false),
		ObjetivoHoyItem(texto: "Llamar al dentista", completado: true),
	])
}
