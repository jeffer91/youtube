# Bloque 03 — Carga y preview de video

## Objetivo

Permitir seleccionar un video local, mostrar sus datos y reproducirlo dentro de la app.

## Archivos

```txt
03_carga_y_preview_video/
├─ YTVideoService.js
├─ YTVideoDialog.js
├─ YTVideoStore.js
├─ YTVideoCheck.js
└─ YTVideoManual.md
```

## Cómo probar

1. Ejecutar `npm start`.
2. Presionar `Seleccionar video`.
3. Escoger un archivo MP4.
4. Confirmar que aparezcan nombre, ruta, peso, extensión y preview.
5. Presionar `Reproducir / Pausar`.
6. Confirmar que el video reproduce y pausa.
7. Presionar `Diagnóstico`.
8. Confirmar que aparece el Bloque 03.

## Criterio de aprobación

El bloque queda aprobado si el explorador abre, el MP4 aparece en pantalla, reproduce, pausa y el diagnóstico reconoce el Bloque 03.
