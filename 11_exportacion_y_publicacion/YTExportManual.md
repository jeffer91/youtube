# Bloque 11 — Exportación y publicación

## Objetivo

Crear el cierre del flujo de AutoEdit Studio: plan de exportación, render final por plataforma y paquete de publicación.

## Carpeta

`11_exportacion_y_publicacion/`

## Archivos creados

- `YTExportModel.js`
- `YTExportStore.js`
- `YTExportService.js`
- `YTExportIpc.js`
- `YTExportCheck.js`
- `YTExportManual.md`

## Función de cada archivo

- `YTExportModel.js`: define plataformas, formatos, nombres y estructura del plan.
- `YTExportStore.js`: guarda sesión, plan y paquete de publicación.
- `YTExportService.js`: crea plan y renderiza con FFmpeg.
- `YTExportIpc.js`: conecta el bloque con Electron.
- `YTExportCheck.js`: diagnostica carpetas, presets, sesión y FFmpeg.
- `YTExportManual.md`: explica el bloque y cómo probarlo.

## Con qué se conecta

- Bloque 03 — Carga y preview de video.
- Bloque 04 — Render mínimo.
- Bloque 05 — Diagnóstico.
- Bloque 06 — Proyectos.
- Bloque 09 — Subtítulos, capas y estilos.
- Bloque 10 — Biblioteca y recursos.

## Entrada

- Video cargado.
- Proyecto actual.
- Opcional: subtítulos, capas, estilo y biblioteca.
- Plataforma de salida.

## Salida

Crea o actualiza:

- `user_data/exports/final/`
- `user_data/database/YTExportSession.json`
- `user_data/projects/project_.../YTExportPlan.json`
- `user_data/projects/project_.../YTPublicationPackage.json`
- Videos finales `.mp4`

## Cómo probar este bloque

1. Ejecutar:

```bash
npm install
npm start
```

2. Seleccionar un video.
3. Crear proyecto.
4. Presionar `Crear plan exportación`.
5. Presionar `Exportar final`.
6. Revisar la carpeta `user_data/exports/final/`.
7. Ejecutar diagnóstico.

Prueba por terminal:

```bash
npm run check:export
```

## Resultado esperado

La app debe crear un plan de exportación, exportar un MP4 final y dejar preparada la información de publicación.

## Criterio de aprobación

El bloque queda aprobado si:

- Se crea `user_data/exports/final/`.
- Se crea `YTExportSession.json`.
- Se crea un plan de exportación.
- Se puede exportar un MP4 final si hay video cargado.
- El diagnóstico no muestra error crítico.

## Errores que indican fallo

- No se crea la carpeta de exportación.
- No se crea `YTExportSession.json`.
- No aparece el plan.
- FFmpeg no está disponible.
- El MP4 final pesa 0 KB.
- El diagnóstico muestra `ERROR` en el Bloque 11.
