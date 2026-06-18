# Bloque 08 — Clips y timeline

Objetivo: convertir segmentos sugeridos del análisis en clips reales y armar un timeline base.

## Archivos

- YTClipModel.js
- YTClipStore.js
- YTClipService.js
- YTClipIpc.js
- YTClipCheck.js
- YTClipManual.md

## Qué crea

Dentro del proyecto actual:

- user_data/projects/project_.../YTClips.json
- user_data/projects/project_.../YTTimeline.json

También crea:

- user_data/database/YTClipSession.json

## Cómo probar

1. npm install
2. npm start
3. Seleccionar video
4. Crear proyecto
5. Guardar transcripción
6. Analizar texto
7. Generar clips
8. Crear timeline
9. Ejecutar diagnóstico

Terminal:

npm run check:clips

Aprobación: se crean YTClips.json, YTTimeline.json y YTClipSession.json.
