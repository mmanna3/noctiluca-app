# Lo que falta para que la app funcione offline

## El problema

Al entrar a la app aparece una pantalla en blanco con spinner ("Cargando"/"Sincronizando"). Lo mismo pasa al entrar a una carpeta o a un escrito. Ocurre cada vez que se cierra y reabre la app.

Se quiere que estas funcionalidades anden **siempre, haya conexión o no** (como Keep o Apple Notes):

- Marcar hábitos como completos
- Navegar entre carpetas
- Leer escritos
- Editar escritos
- Crear escritos

## Diagnóstico (estado actual del código)

La app está en la fase "MVP online-only" del plan de migración. No hay ninguna persistencia local:

- `src/app/_layout.tsx:16-23` — el `QueryClient` solo define `retry: 1` y `staleTime: 30_000`. No tiene `gcTime` extendido ni ningún persister a disco. El cache es 100% en memoria y se pierde en cada reinicio de la app.
- `src/api/custom-hooks/use-api-query.tsx` y `use-api-mutation.tsx` son wrappers finos de `useQuery`/`useMutation` que llaman directo a la red, sin fallback a datos ya conocidos ni cola offline.
- Pantallas con spinner bloqueante en cada mount, sin mostrar datos previos:
  - Lista de carpetas: `src/app/(app)/index.tsx:35-41`
  - Detalle de carpeta (lista de escritos): `src/app/(app)/[carpetaId]/escritos.tsx:28-60`
  - Detalle/edición de escrito: `src/app/(app)/[carpetaId]/escritos/ver/[id].tsx:24-28`
- `src/sync/` ya tiene lógica pura escrita (tipos, helpers de id/fecha, compactación de outbox, transforms `*Local` → DTO) pero **no está conectada a ninguna base de datos real**. `src/sync/pedir-sync.ts` es un stub explícito: "el motor de sync se implementa en Phase 7 (expo-sqlite)". `src/sync/estado-sync.ts` solo trackea flags online/pending/syncing para el indicador visual, no sincroniza nada de verdad.
- `src/components/guard-sesion-privada.tsx:12-14` confirma en comentario: "En fase online-only no hay carpetas locales... Phase 7 inyectará las carpetas reales desde la DB local."
- `package.json`: no está instalado `expo-sqlite` ni ningún persister de React Query (`@tanstack/query-async-storage-persister`, etc.).
- El plan de migración (`../plan_migración_a_expo_claude.md:801-803`) ya prevé esto como **"Fase 7 — SQLite + sync offline (~5-8h)"**, con el objetivo explícito: "Reemplazar React Query directo → arquitectura offline-first con expo-sqlite, igual al fe actual." Fase que todavía no arrancó en código.

## Dos caminos posibles

### 1. Parche rápido (cache persistente, ~1-2h)

Agregar un persister de React Query sobre AsyncStorage (`@tanstack/query-async-storage-persister`) y ajustar las pantallas para renderizar con el último dato conocido en cache mientras se refresca en segundo plano (stale-while-revalidate), en vez de bloquear con spinner.

- ✅ Elimina el spinner molesto en la gran mayoría de los casos (leer carpetas, escritos).
- ❌ No resuelve escritura offline real: marcar un hábito o crear/editar un escrito sin conexión seguiría fallando, porque no hay outbox conectado.

### 2. Solución completa: Fase 7 del plan (~5-8h)

Implementar el motor SQLite ya scaffoldeado en `src/sync/`: lecturas local-first + outbox de escrituras (push/pull con sync en background). Esto es lo que da el comportamiento real de Keep/Notes: todo funciona instantáneo y sin red (leer, navegar, marcar hábitos, crear/editar escritos), y sincroniza solo cuando vuelve la conexión.

Pasos según el plan de migración:
- Instalar `expo-sqlite`
- Escribir `src/sync/db.ts` (esquema y acceso a SQLite)
- `src/sync/use-live-query.ts` (lecturas reactivas desde SQLite)
- Adaptar `lecturas.ts` para consultar SQLite en vez de la red
- `src/sync/sync-engine.ts` (push/pull real usando el outbox ya existente)

## Recomendación

Como se pidió que **todas** las funcionalidades (incluidas escrituras: marcar hábito, crear/editar escrito) anden sin conexión, el parche rápido no alcanza — solo tapa el spinner en lectura. Hace falta encarar la Fase 7 completa para cumplir el objetivo real.
