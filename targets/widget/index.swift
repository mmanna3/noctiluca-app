import WidgetKit
import SwiftUI

@main
struct exportWidgets: WidgetBundle {
	var body: some Widget {
		ObjetivosHoyWidget()
		ObjetivosSemanaWidget()
		ObjetivosMesWidget()
		ObjetivosAnioWidget()
		ObjetivosLustroWidget()
	}
}
