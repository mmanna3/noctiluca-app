# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Instalar en tu iPhone (build interno, sin App Store)

```bash
npm run compilar:iphone
```

Esto corre `eas build --platform ios --profile internal` y tarda ~10-15 min en la nube de EAS.

1. EAS manda un email con un link de descarga + un QR (también aparece en la terminal y en expo.dev).
2. Abrí ese link desde **Safari en el iPhone** (no Chrome — si no, no instala).
3. Tocá "Instalar" → la app aparece en la pantalla de inicio.
4. En el iPhone: **Configuración → General → VPN y gestión de dispositivo → Confiar** en el certificado del desarrollador (si no, la app da error al abrir).

Prerrequisitos (una sola vez):

- `eas login` con la cuenta de expo.dev.
- El dispositivo registrado en el perfil de Apple Developer (`eas device:create` la primera vez con ese iPhone).
- Certificados de Apple guardados en EAS — si no existen, el primer build los pide automáticamente.

## Cuando hay cambios nativos (widgets, por ej.)

Si tocaste código nativo (Swift, un módulo en `modules/`, un target en `targets/` como el widget) y te aparece un error tipo `Cannot find native module '...'` en el simulador, es porque el binario que tenés corriendo es de antes de ese cambio — un reload de JS (Fast Refresh, `expo start`) nunca agrega código nativo nuevo, hay que recompilar la app:

```bash
npx expo prebuild -p ios
cd ios && pod install && cd ..
npx expo run:ios
```

- `prebuild` regenera `ios/` en base a la config y los targets (incluye el widget vía `@bacons/apple-targets`).
- `pod install` linkea los módulos nativos nuevos o modificados.
- `run:ios` compila y reinstala en el simulador.

Esto también aplica si estás probando en **Expo Go**: ahí directamente no funciona, porque Expo Go no soporta módulos nativos custom — hace falta el dev client de este proyecto.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
