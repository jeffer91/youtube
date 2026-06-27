# Bloque 8 - Plan de edición backend

## Objetivo

Conectar la segunda etapa real del flujo profesional de AutoVideoJeff: Plan de edición.

Desde este bloque, la ruta:

```text
POST /api/proyectos/:proyectoId/plan/procesar
```

dejó de ser placeholder y ahora genera un plan de edición usando el entendimiento guardado.

## Archivo nuevo principal

```text
etapas/02-plan/procesar-plan-edicion.service.js
```

## Qué hace el servicio

```text
carga estado-proyecto.json
carga 01-entendimiento/reporte-entendimiento.json
extrae transcripción, momentos clave, necesidades y duración
crea subtítulos sugeridos
crea textos sugeridos
crea recursos sugeridos
crea zooms, efectos y animaciones sugeridas
crea planProduccion usando el módulo existente de producción
valida el plan
guarda 02-plan/plan-edicion.json
actualiza estado a PLANIFICADO
marca error controlado si falla
```

## Conexión con módulos existentes

El servicio reutiliza:

```text
produccion/crear-plan-produccion.service.js
produccion/produccion.modelo.js
produccion/linea-tiempo-produccion.service.js
flujo-etapas/cargar-resultado-etapa.service.js
flujo-etapas/guardar-resultado-etapa.service.js
```

## Resultado generado

El archivo estándar del flujo por etapas queda en:

```text
02-plan/plan-edicion.json
```

El resultado incluye:

```text
resumen del plan
lectura editorial del plan
planProduccion
elementos revisables
lineaTiempo
validación
fuente desde entendimiento
```

## Cambio en API por etapas

Se actualizó:

```text
server/rutas-etapas.service.js
```

Ahora cuando la etapa solicitada es `plan`, la ruta llama a:

```text
procesarPlanEdicionProyectoEtapa
```

Las etapas de producción, adaptación y resultado siguen como placeholder hasta sus bloques respectivos.

## Estado

```text
bloque: 8
nombre: Plan de edición backend
estado: implementado
siguiente_bloque: Pantalla Plan de edición
```
