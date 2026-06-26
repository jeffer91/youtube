# AutoVideoJeff

App modular para editar videos automaticamente desde una interfaz sencilla.

La idea principal es que Jeff pueda cargar un video, procesarlo con un clic y obtener una version final lista para redes sociales, especialmente TikTok.

## Estado actual

Estado del proyecto: **entrega funcional preparada**.

La app ya tiene:

- Modo escritorio con Electron.
- Servidor local con Express.
- Pantalla para cargar videos.
- Diagnostico automatico antes de procesar.
- Barra de progreso real.
- Flujo principal conectado por etapas.
- Modulos de entrada, entendimiento, audio, transcripcion, edicion dinamica, edicion y salida.
- Exportacion final con FFmpeg.
- Modulos opcionales blindados para continuar si fallan.
- Comparacion antes/despues al terminar la exportacion.
- Archivos BAT para abrir, actualizar, verificar y crear instalador.
- Configuracion para generar instalador de Windows.

## Como se usa sin programar

Haz doble clic en:

```txt
abrir_app.bat
```

Para actualizar desde GitHub y abrir:

```txt
actualizar_y_abrir.bat
```

Para verificar todo:

```txt
verificar_app.bat
```

Para crear instalador de Windows:

```txt
crear_instalador_windows.bat
```

## Como se usa desde Visual Studio Code

```bash
npm install
npm start
```

## Comandos utiles

```bash
npm run check:bloque1
npm run check:bloque2
npm run check:bloque3
npm run check:bloque4
npm run check:todo
```

Crear instalador:

```bash
npm run dist:win
```

## Estructura principal

```txt
AutoVideoJeff/
├── app/                 Interfaz visual
├── audio/               Mejora y preparacion de audio
├── biblioteca/          Recursos reutilizables
├── comun/               Herramientas compartidas necesarias
├── diagnostico/         Revision automatica de salud del sistema
├── editar/              Plan de edicion y efectos visuales
├── entrada/             Recepcion y copia de videos
├── entender/            Analisis tecnico del video
├── entrega/             Verificacion y entrega final
├── motor/               Flujo principal
├── progreso/            Barra y eventos de progreso
├── salida/              Exportacion final y antes/despues
├── scripts/             Verificaciones manuales
└── transcripcion/       Subtitulos, textos flotantes y Gemini opcional
```

## Regla de arquitectura

Cada carpeta representa una funcionalidad.

Cada funcionalidad debe tener una conexion principal, por ejemplo:

```txt
audio/audio.conexion.js
entrada/entrada.conexion.js
entender/entender.conexion.js
editar/editar.conexion.js
salida/salida.conexion.js
salida/antes-despues/antes-despues.conexion.js
entrega/entrega.conexion.js
transcripcion/transcripcion.conexion.js
```

## Flujo de trabajo

```txt
entrada
  ↓
entender
  ↓
audio
  ↓
transcripcion
  ↓
edicion dinamica
  ↓
editar
  ↓
salida
  ↓
antes/despues
```

## Reglas del proyecto

1. Ningun archivo debe pasar de 1000 lineas.
2. Si un archivo crece demasiado, se divide por funcionalidad.
3. Cada carpeta debe representar una funcionalidad clara.
4. Cada funcionalidad debe tener su archivo de conexion.
5. Si una funcionalidad falla, no debe romper innecesariamente toda la app.
6. La exportacion final debe conservar el video original y el video editado.
7. Al exportar debe mostrarse una comparacion antes/despues.

## Bloques completados

| Bloque | Estado |
|---|---|
| Bloque 1 - Base ordenada | Completado |
| Bloque 2 - Modulos blindados | Completado |
| Bloque 3 - Antes/despues | Completado |
| Bloque 4 - Entrega final | Completado |

## Documentacion de avance

```txt
docs/bloque-1-estado.md
docs/bloque-2-estado.md
docs/bloque-3-estado.md
docs/bloque-4-estado.md
docs/guia-uso-diario.md
```

## Version

Version actual declarada en `package.json`: **0.3.6**.
