# Bloque 10 — Biblioteca y recursos

## Objetivo

Crear una biblioteca local para guardar, clasificar y reutilizar recursos del proyecto: audio, imágenes, videos de apoyo, subtítulos, textos y archivos JSON.

## Carpeta

`10_biblioteca_y_recursos/`

## Archivos creados

- `YTResourceModel.js`
- `YTResourceScanner.js`
- `YTLibraryStore.js`
- `YTLibraryService.js`
- `YTLibraryIpc.js`
- `YTLibraryCheck.js`
- `YTLibraryManual.md`

## Función de cada archivo

- `YTResourceModel.js`: define tipos de recursos, extensiones compatibles y modelo de recurso.
- `YTResourceScanner.js`: recorre carpetas y detecta recursos compatibles.
- `YTLibraryStore.js`: crea y mantiene `YTLibrarySession.json` y la carpeta `user_data/media/library/`.
- `YTLibraryService.js`: importa, escanea y vincula recursos al proyecto actual.
- `YTLibraryIpc.js`: conecta la biblioteca con Electron y la interfaz.
- `YTLibraryCheck.js`: diagnostica que la biblioteca pueda crear carpetas, guardar sesión, importar y escanear.
- `YTLibraryManual.md`: explica el bloque y la prueba.

## Con qué se conecta

- Bloque 02 — Archivos y datos.
- Bloque 05 — Diagnóstico.
- Bloque 06 — Proyectos.
- Bloque 09 — Subtítulos, capas y estilos.

## Entrada

Recibe archivos locales compatibles:

- Audio: `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`
- Imágenes: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`
- Video: `.mp4`, `.mov`, `.mkv`, `.webm`, `.avi`
- Subtítulos: `.srt`, `.vtt`, `.ass`
- Texto/datos: `.txt`, `.md`, `.json`

## Salida

Crea o actualiza:

- `user_data/media/library/`
- `user_data/database/YTLibrarySession.json`
- `user_data/projects/project_.../YTProjectResources.json`

## Cómo probar este bloque

1. Ejecutar:

```bash
npm install
npm start
```

2. Presionar `Importar recursos`.
3. Elegir una imagen, audio, video corto o archivo de subtítulos.
4. Revisar el panel `Biblioteca y recursos`.
5. Presionar `Escanear biblioteca`.
6. Crear o abrir un proyecto.
7. Presionar `Vincular recursos`.
8. Ejecutar `Diagnóstico`.

Prueba por terminal:

```bash
npm run check:library
```

## Resultado esperado

La app debe mostrar cuántos recursos existen en biblioteca y crear los archivos de biblioteca local.

## Criterio de aprobación

El bloque queda aprobado si:

- Se crea `user_data/media/library/`.
- Se crea `YTLibrarySession.json`.
- Se puede importar al menos un recurso.
- El diagnóstico muestra el Bloque 10 sin error crítico.
- Se puede crear `YTProjectResources.json` cuando hay proyecto actual.

## Errores que indican fallo

- No se abre el selector de archivos.
- No se crea la carpeta `library`.
- No se crea `YTLibrarySession.json`.
- El recurso queda con estado `MISSING` aunque el archivo exista.
- El diagnóstico muestra `ERROR` en el Bloque 10.
