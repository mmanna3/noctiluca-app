# CLAUDE.md — noctiluca-app

App Expo (React Native) que reemplaza noctiluca-fe. Compila para **iPhone** (distribución interna via EAS) y **web** (export estático).

Ver plan completo de migración en: `../plan_migración_a_expo_claude.md`

## Comandos

```bash
npm start              # Dev server (Expo Go o dev build)
npm run ios            # Simulador iOS
npm run web            # Web en navegador
npm run lint           # ESLint
npx expo export --platform web   # Export estático web
eas build --platform ios --profile internal   # Build para iPhone
```

## Estructura

```
src/
  app/          # Expo Router — pantallas (archivo = ruta)
  api/          # Cliente HTTP y hooks React Query
  components/   # Componentes reutilizables (UI + guards)
  hooks/        # Hooks globales (auth, sesión privada, etc.)
  sync/         # Motor de sincronización offline (expo-sqlite)
  privacidad/   # Lógica de carpetas privadas (hashing, sesión)
  utils/        # Utilidades puras
assets/         # Íconos, splash, imágenes
```

## Convenciones

- Todo en **español** (código, nombres, UI, comentarios)
- Tabs (4 espacios), comillas dobles, punto y coma
- Componentes: PascalCase; hooks: `usar-` o `use-` kebab-case; utils: kebab-case
- `@/` es alias a `src/`

## Backend

- API: variable de entorno `EXPO_PUBLIC_API_URL` → `.env.local`
- Sin cambios en noctiluca-be
- Documentación OpenAPI en `/swagger` del backend

## Tech stack

- Expo SDK 57, React Native 0.86, React 19
- Expo Router v3 (file-based routing)
- NativeWind v4 (Tailwind en RN)
- Zustand (estado global)
- TanStack React Query v5 (server state)
- expo-sqlite (offline, Fase 7)
- expo-secure-store (JWT en iOS), AsyncStorage (JWT en web)
- expo-crypto (hashing contraseñas)
- lucide-react-native (íconos)
- victory-native (gráficos)
