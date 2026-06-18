# Bloque 09 — Subtítulos, capas y estilos

Objetivo: crear subtítulos base, capas visuales y un preset de estilo para el proyecto actual.

## Archivos

- YTStyleModel.js
- YTStyleStore.js
- YTSubtitleService.js
- YTLayerService.js
- YTStyleIpc.js
- YTStyleCheck.js
- YTStyleManual.md

## Qué crea

Dentro del proyecto actual:

- user_data/projects/project_.../YTSubtitles.json
- user_data/projects/project_.../YTLayers.json
- user_data/projects/project_.../YTStylePreset.json

También crea:

- user_data/database/YTStyleSession.json

## Cómo probar

1. npm install
2. npm start
3. Seleccionar video
4. Crear proyecto
5. Guardar transcripción
6. Analizar texto
7. Generar clips
8. Crear timeline
9. Generar subtítulos
10. Crear capas
11. Aplicar estilo
12. Ejecutar diagnóstico

Terminal:

npm run check:styles

Aprobación: se crean YTSubtitles.json, YTLayers.json, YTStylePreset.json y YTStyleSession.json.
