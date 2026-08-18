import { registerWebModule, NativeModule } from 'expo';

// WidgetObjetivosModule is not available on the web platform.
class WidgetObjetivosModule extends NativeModule<{}> {}

export default registerWebModule(WidgetObjetivosModule, 'WidgetObjetivosModule');
