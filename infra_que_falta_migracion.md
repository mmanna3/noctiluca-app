# Infraestructura pendiente para tener Noctiluca en el iPhone sin Expo Go

## Estado actual

El código está listo para buildear. El `app.json` tiene el `bundleIdentifier`,
el `projectId` de EAS y la `apiUrl` del backend configurados.
Lo que falta es exclusivamente infraestructura de distribución Apple + un build.

---

## Lo que tenés que hacer vos (no se puede automatizar)

### 1. Apple Developer Program — $99/año
Sin esto nada funciona fuera de Expo Go.
- Enrollarse en: https://developer.apple.com/programs/enroll/
- Requiere: Apple ID, tarjeta de crédito, puede tardar 24–48 h en activarse.
- Si ya tenés membresía activa, salteá este paso.

### 2. Registrar tu iPhone en EAS (una sola vez)
```bash
cd noctiluca-app
eas device:create
```
- Te muestra un QR. Lo escaneás con el iPhone.
- Instala un perfil de confianza (lo acepta en Ajustes → General → VPN y gestión del dispositivo).
- EAS registra el UDID del dispositivo para poder instalar builds Ad Hoc.

### 3. Buildear la app (cada vez que quieras actualizar)
```bash
eas build --platform ios --profile internal
```
- Tarda ~15–20 min en los servidores de Expo (la primera vez puede tardar más porque genera los certificados Apple automáticamente — necesita que inicies sesión con tu Apple ID durante el proceso).
- Al terminar manda un mail con un link de descarga + QR.
- Abrís el link en Safari del iPhone → instalás → listo.

**Alternativa más cómoda**: EAS Update para actualizaciones de JS sin rebuild completo.
Solo se necesita el build nativo la primera vez o cuando cambian dependencias nativas.
```bash
eas update --branch main --message "descripción del cambio"
```

---

## Lo que está configurado y no tenés que tocar

| Qué | Dónde | Estado |
|-----|-------|--------|
| Bundle ID | `app.json` → `ios.bundleIdentifier` | ✓ `com.mmanna3.noctiluca` |
| EAS Project ID | `app.json` → `extra.eas.projectId` | ✓ configurado |
| URL del backend | `app.json` → `extra.apiUrl` | ✓ apuntando a Plesk |
| Perfil de build interno | `eas.json` → `build.internal` | ✓ `distribution: internal` |
| Perfil de build producción | `eas.json` → `build.production` | ✓ listo para App Store |
| SecureStore (token JWT) | `src/hooks/use-auth.ts` | ✓ usa iOS Keychain |

---

## Dependencias nativas que requieren rebuild al agregar

Cada vez que se instala un paquete que tiene código nativo hay que hacer un nuevo
`eas build`. Las puramente JS se pueden actualizar con `eas update`.

Nativas ya incluidas (ya están en el próximo build):
- `expo-secure-store` — Keychain de iOS
- `expo-local-authentication` — Face ID / Touch ID ← **agregado ahora**
- `@react-native-community/netinfo` — estado de red

---

## Flujo completo de una primera instalación

```
1. eas login                          # iniciar sesión con cuenta Expo
2. eas device:create                  # registrar iPhone (solo la primera vez)
3. eas build --platform ios --profile internal
   # ~20 min → link por mail
4. Abrir link en Safari del iPhone
5. Instalar → confiar en el desarrollador en Ajustes
```
