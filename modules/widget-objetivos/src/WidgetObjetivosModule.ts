import { NativeModule, requireNativeModule } from "expo";

declare class WidgetObjetivosModule extends NativeModule<{}> {
	escribirSnapshotObjetivosHoy(json: string): void;
	escribirSnapshotObjetivosSemana(json: string): void;
}

export default requireNativeModule<WidgetObjetivosModule>("WidgetObjetivos");
