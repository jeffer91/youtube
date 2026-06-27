# Motor de efectos automáticos

Este documento resume el flujo de efectos visuales de AutoVideoJeff.

## Flujo principal

```text
Catálogo de 50+ efectos
→ análisis de contexto visual
→ planificador local o Gemini
→ validación del plan
→ compilador FFmpeg
→ render final
→ auditoría de efectos
```

## Selectores disponibles

- **Automático:** usa Gemini si está activado; si falla, vuelve al selector local.
- **Local seguro:** nunca llama a Gemini; selecciona por reglas del perfil.
- **Gemini:** intenta que Gemini escoja los efectos desde el catálogo permitido.

## Controles desde la interfaz

En Nuevo proyecto → Opciones avanzadas → Efectos visuales:

- Usar motor de efectos.
- Selector: Automático, Local seguro o Gemini.
- Intensidad: Suave, Normal o Fuerte.
- Máximo de efectos: 8, 12, 16 o 20.

## Auditoría generada por proyecto

Cada procesamiento puede guardar:

```text
datos/proyectos/<proyecto>/efectos/efectos-render.json
datos/proyectos/<proyecto>/efectos/diagnostico-efectos.json
```

El diagnóstico registra:

- perfil usado;
- intensidad;
- selector usado;
- si hubo fallback local;
- total de efectos del plan;
- filtros FFmpeg aplicados;
- efectos omitidos;
- categorías usadas;
- efectos principales con inicio y fin.

## Reglas de seguridad

- Gemini no puede inventar efectos nuevos.
- Si Gemini falla, el video no se detiene.
- Si el compilador omite un efecto, se mantiene el render con los filtros válidos.
- Si el motor completo falla, se conserva el filtro visual anterior.

## Lectura rápida del resultado

En el panel final, la app muestra un resumen como:

```text
Efectos: 12 filtros aplicados · plan 12 · perfil 11 contra 11 · intensidad fuerte · selector Local.
```

Esto permite confirmar si el video realmente recibió efectos visibles.
