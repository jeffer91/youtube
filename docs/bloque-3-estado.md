# Bloque 3 - Exportacion antes y despues

Este documento resume el Bloque 3 en lenguaje simple.

## Objetivo del bloque

Al terminar una exportacion, la app debe mostrar y guardar una comparacion clara:

- Video original: Antes.
- Video exportado: Despues.
- Resumen de cambios aplicados.
- Reporte JSON dentro del proyecto.

## Que se agrego

| Parte | Estado |
|---|---|
| Conexion de antes/despues | Creada |
| Copia visible del video original | Creada en videos exportados |
| Reporte antes-despues.json | Creado por proyecto |
| Vista antes/despues en la interfaz | Agregada |
| Estilos visuales de comparacion | Agregados |
| Verificacion de bloque 3 | Agregada |

## Como queda funcionando

Cuando la app termina de exportar:

1. Guarda el video final.
2. Copia una version del video original para poder mostrarlo en la interfaz.
3. Crea el reporte `antes-despues.json`.
4. Muestra dos reproductores: Antes y Despues.
5. Muestra un resumen de los cambios aplicados.

## Comando de revision

Desde Visual Studio Code:

```bash
npm run check:bloque3
```

## Estado final del bloque

Bloque 3 completado a nivel de codigo.

La exportacion ya queda preparada con original, final y comparacion antes/despues.
