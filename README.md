# Video Editor Electron

App de escritorio en Electron para organizar un flujo de edición de video por pantallas y capas.

## Requisitos

- Node.js 22.12.0 o superior.
- npm.
- Windows, macOS o Linux.
- FFmpeg se instala por dependencia mediante `@ffmpeg-installer/ffmpeg`.
- Para transcripción real, Whisper debe estar instalado o configurado en la variable `WHISPER_BIN` o `WHISPER_COMMAND`.
- Para Google Sheets, la conexión debe configurarse desde la app con el Web App URL y el Spreadsheet ID.

## Instalación limpia

```bash
npm install
```

Este comando también regenera `package-lock.json` de forma limpia si no existe.

## Verificar estructura

```bash
npm run verify
```

El verificador revisa:

- Entrada de Electron.
- `src/index.html`.
- Router centralizado.
- Flujo de 12 pantallas.
- HTML, CSS y JS de cada paso.
- Funciones iniciales exportadas por pantalla.
- Dependencia fija de Electron.

## Ejecutar la app

```bash
npm start
```

## Flujo principal

1. Video base y diagnóstico.
2. Formato inteligente.
3. Transcripción y análisis.
4. Cortes inteligentes.
5. Transiciones selectivas.
6. Audio principal.
7. Música y sonidos.
8. Color y limpieza.
9. Recursos visuales.
10. Textos y animaciones.
11. Subtítulos finales.
12. Revisión y exportación.

## Estado funcional actual

La app tiene el flujo principal conectado. Algunas pantallas usan motores reales, como carga de proyecto, audio, transcripción y subtítulos. Otras pantallas guardan una capa o decisión provisional para mantener el flujo completo sin romper la navegación.

## Datos locales

La carpeta `data/` es de ejecución local y está ignorada por Git. Ahí se guardan respaldos, configuraciones, proyectos y archivos procesados generados en la PC.

## Comandos recomendados después de clonar

```bash
npm install
npm run verify
npm start
```

Si `npm run verify` marca errores, no ejecutes la app hasta corregirlos.
