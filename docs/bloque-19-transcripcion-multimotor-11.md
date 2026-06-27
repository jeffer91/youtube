# Bloque 19.11 - Selección manual de transcripción principal

## Objetivo

Permitir que el usuario elija manualmente cuál transcripción debe usarse como principal para el plan de edición.

Este bloque completa la revisión humana dentro de Entendimiento: si un motor transcribe mejor que otro, se puede marcar como principal sin reprocesar el video.

## Archivos creados

```text
transcripcion/motores/seleccionar-transcripcion-principal.service.js
scripts/verificar-bloque-19-transcripcion-multimotor-11.js
docs/bloque-19-transcripcion-multimotor-11.md
```

## Archivos modificados

```text
server/rutas-modulares.service.js
app/pantallas/entendimiento.view.js
app/etapas-ui/entendimiento-ui.js
app/entendimiento.css
```

## Endpoint agregado

```text
POST /api/proyectos/:proyectoId/transcripciones/:motor/usar
```

## Qué hace el servicio

```text
1. Recibe proyectoId y motor.
2. Carga la transcripción guardada de ese motor.
3. Valida que tenga texto útil.
4. La guarda como transcripcion-principal.json.
5. Actualiza resumen-motores.json.
6. Guarda seleccion-manual.json.
7. Devuelve la nueva transcripción principal a la UI.
```

## Qué cambia en la UI

En la sección de transcripción se agrega una zona de acciones con el botón:

```text
Usar esta como principal
```

Ese botón aparece cuando el usuario selecciona una transcripción de motor con texto útil.

## Regla de seguridad funcional

No se permite marcar como principal una transcripción vacía, omitida o sin texto útil, salvo que el backend reciba explícitamente `permitirVacia: true`.

## Resultado esperado

Después de seleccionar un motor como principal, el proyecto tendrá:

```text
transcripciones/principal/transcripcion-principal.json
transcripciones/principal/seleccion-manual.json
transcripciones/resumen-motores.json
```

## Qué NO hace todavía

```text
- No ejecuta una prueba completa con video real.
- No valida rendimiento de cada motor en una PC real.
- No corrige instalaciones faltantes.
```

## Siguiente bloque

Bloque 19.12: prueba completa con video real.

Debe probar el flujo completo:

```text
Nuevo proyecto
Procesar entendimiento
Diagnosticar motores
Ver transcripciones por motor
Elegir principal
Confirmar archivos generados
```

## Criterio de aceptación

El verificador debe devolver:

```text
Bloque 19.11 OK: selección manual de transcripción principal disponible.
```
