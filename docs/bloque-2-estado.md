# Bloque 2 - Modulos blindados

Este documento resume el Bloque 2 en lenguaje simple.

## Objetivo del bloque

Evitar que una parte opcional dañe toda la app.

La regla principal es:

> Si falla una funcionalidad opcional, la app debe continuar con una alternativa segura.

## Que se blindó

| Funcionalidad | Si falla | Que hace ahora |
|---|---|---|
| Audio | No se puede limpiar o mejorar | Usa el audio original |
| Transcripcion | No se pueden crear subtitulos/textos | Continua sin textos automaticos |
| Edicion dinamica | No se pueden cortar silencios o ajustar tiempos | Continua con el video original |
| Visual dinamico | No se pueden agregar zooms/barra/etiquetas | Mantiene el filtro base |

## Que no se hizo en este bloque

No se cambio la exportacion antes/despues. Eso queda para el Bloque 3.

No se creo instalador ni APK. Eso queda para el Bloque 4.

## Comando de revision

Desde Visual Studio Code:

```bash
npm run check:bloque2
```

## Estado final del bloque

Bloque 2 completado a nivel de codigo.

La app queda mas resistente: audio, transcripcion, edicion dinamica y visual dinamico ya tienen salida segura si algo falla.
