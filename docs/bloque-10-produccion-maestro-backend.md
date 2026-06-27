# Bloque 10 - Producción maestro backend

## Objetivo

Conectar la tercera etapa real del flujo profesional de AutoVideoJeff: Producción maestro.

Desde este bloque, la ruta:

```text
POST /api/proyectos/:proyectoId/produccion/procesar
```

dejó de ser placeholder y ahora ejecuta producción real usando el entendimiento y el plan de edición guardados.

## Archivo nuevo principal

```text
etapas/03-produccion/procesar-produccion-maestro.service.js
```

## Qué hace el servicio

```text
carga estado-proyecto.json
carga videos-originales.json
carga 01-entendimiento/reporte-entendimiento.json
carga 02-plan/plan-edicion.json
reconstruye entrada compatible con el motor actual
crea opciones de producción desde el plan
crea transcripción desde entendimiento
crea edición dinámica base desde el plan
llama a editarVideo
llama a prepararSalida
exporta video maestro
guarda 03-produccion/produccion.json
actualiza estado a PRODUCIDO
marca error controlado si falla
```

## Motores reutilizados

El bloque reutiliza la estructura que ya existe:

```text
editar/editar.conexion.js
salida/salida.conexion.js
salida/exportar-simple/exportar.service.js
flujo-etapas/cargar-resultado-etapa.service.js
flujo-etapas/guardar-resultado-etapa.service.js
```

## Resultado generado

El archivo estándar del flujo por etapas queda en:

```text
03-produccion/produccion.json
```

Este resultado incluye:

```text
videoMaestro
planProduccion usado
edición generada
salida exportada
auditoría de producción
resumen para adaptación
antes/después cuando el exportador lo genera
reporte final del render
```

## Cambio en API por etapas

Se actualizó:

```text
server/rutas-etapas.service.js
```

Ahora cuando la etapa solicitada es `produccion`, la ruta llama a:

```text
procesarProduccionMaestroProyectoEtapa
```

Las etapas de adaptación y resultado siguen como placeholder hasta sus bloques respectivos.

## Estado

```text
bloque: 10
nombre: Producción maestro backend
estado: implementado
siguiente_bloque: Pantalla Producción maestro
```
