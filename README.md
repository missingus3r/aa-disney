# AA Disney

Disney+ en la pantalla de Android Auto, con tu cuenta, para ver películas y series con el auto estacionado.
*Disney+ on the Android Auto screen, signed in with your account, for use while parked.*

> Proyecto personal, no oficial. No está afiliado a Disney, Disney+ ni Google/Android Auto.
> Es el hermano de **[AA Tube](https://github.com/missingus3r/aa-tube)** (YouTube en Android Auto), del que
> comparte casi todo el código.

## Qué hace

- Muestra el sitio de Disney+ (`disneyplus.com`) en la pantalla del auto, con tu cuenta y tus perfiles.
- Reproduce con DRM (Widevine): el video se ve en la pantalla del auto.
- Barra propia con ⏪ 10 s, ⏯, ⏩ 10 s, pantalla completa y recargar.
- Botones del volante y la tarjeta de medios de Android Auto, con título y barra de avance.
- **Al moverse el auto, Android Auto cierra la pantalla** ("No disponible mientras conduces") y el audio
  sigue sonando, controlable desde el volante y la tarjeta de medios. Si queda en pausa sin pantalla, se
  apaga sola a los 10 minutos.

> **Estado:** el login, la reproducción en el auto y el bloqueo al manejar están probados. La adaptación
> de los controles al reproductor de Disney+ (volante, tarjeta de medios, ±10 s, siguiente episodio) es
> nueva y todavía se está probando en autos reales.

## Cómo funciona

Igual que [AA Tube](https://github.com/missingus3r/aa-tube), con dos diferencias para que Disney+ reproduzca:

| Pieza | Qué hace |
|---|---|
| `car/CarActivity` | La pantalla del auto. App "para usar estacionado" (categoría juego, `CAR_LAUNCHER`): Android Auto la dibuja como cualquier pantalla de Android y la cierra al manejar. |
| `GeckoHolder` | Motor [GeckoView](https://mozilla.github.io/geckoview/) (el de Firefox) en **modo escritorio**: los sitios de streaming no reproducen en navegadores de celular. Permite el DRM (Widevine) y la reproducción automática, que GeckoView niega si la app no responde. |
| `MainActivity` | En el teléfono: iniciar sesión en Disney+. La sesión queda guardada y vale en el auto. |
| `player/` + `assets/player/` | Extensión web integrada que encuentra el `<video>` de Disney+ (está dentro de shadow DOM) y toma posición y duración de la barra del propio reproductor. |
| `media/` | Sesión de medios (volante, tarjeta de medios) y servicio en primer plano que mantiene el audio cuando la pantalla se cierra. |

## Requisitos

- Teléfono con Android 15 o superior y Android Auto.
- Una suscripción de Disney+.
- Para compilar: JDK 17 y Android SDK con la plataforma **37.2** (la pide GeckoView 158).
- Solo se compila para `arm64-v8a`.

## Instalar

1. Compilar: `./gradlew assembleDebug` (queda en `app/build/outputs/apk/debug/`).
2. Instalar el APK en el teléfono (`adb install app-debug.apk`, o copiándolo).
3. En el teléfono, en **Android Auto**: tocar varias veces "Versión" para activar el modo
   desarrollador, y en ⋮ → Configuración para desarrolladores activar **Fuentes desconocidas**.
4. Abrir **AA Disney en el teléfono** e iniciar sesión en Disney+.
5. En el auto, AA Disney aparece en el lanzador de Android Auto (si no, agregarla desde
   Android Auto → Personalizar selector).

## Autos confirmados

| Auto | Año |
|---|---|
| Peugeot 208 | 2025 |

**¿Te sirvió el repo?** Hacé un PR y agregá tu modelo de auto (y el año) a esta tabla, así otros
saben en qué autos funciona.

## Probar sin auto

Se puede usar el [Desktop Head Unit](https://developer.android.com/training/cars/testing/dhu) del SDK.

## Avisos

- Usala solo con el auto detenido. El bloqueo al manejar es de Android Auto y está ahí por seguridad.
- Es el sitio web de Disney+ dentro de un navegador: si Disney+ cambia su sitio, algunos controles pueden
  dejar de andar. El uso de Disney+ queda sujeto a sus términos.
- No hace nada para saltear el DRM: usa la protección Widevine del teléfono igual que un navegador.

## Ver también

- [AA Tube](https://github.com/missingus3r/aa-tube): YouTube en Android Auto.

## Tests

`./gradlew testDebugUnitTest`

## Licencia

[MIT](LICENSE)
