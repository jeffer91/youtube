# Bloque 5 - API por etapas

## Objetivo

Crear la primera capa de rutas API para que AutoVideoJeff deje de depender de un único procesamiento completo y pueda avanzar hacia el flujo profesional por etapas.

El flujo objetivo es:

```text
crear proyecto -> subir videos -> entendimiento -> plan de edición -> producción -> adaptación -> resultado
```

## Qué cambia en este bloque

Este bloque agrega rutas nuevas sin eliminar la ruta legacy actual:

```text
POST /api/procesar-video
```

La ruta legacy se mantiene para no romper el funcionamiento actual mientras se conectan las etapas reales.

## Archivo nuevo principal

```text
server/rutas-etapas.service.js
```

Este archivo registra las rutas del nuevo flujo.

## Rutas creadas

### Proyecto

```text
POST /api/proyectos
GET  /api/proyectos/:proyectoId/estado
POST /api/proyectos/:proyectoId/videos
POST /api/proyectos/:proyectoId/video
```

### Entendimiento

```text
POST /api/proyectos/:proyectoId/entendimiento/procesar
GET  /api/proyectos/:proyectoId/entendimiento
```

### Plan de edición

```text
POST /api/proyectos/:proyectoId/plan/procesar
GET  /api/proyectos/:proyectoId/plan
```

### Producción

```text
POST /api/proyectos/:proyectoId/produccion/procesar
GET  /api/proyectos/:proyectoId/produccion
```

### Adaptación

```text
POST /api/proyectos/:proyectoId/adaptacion/procesar
GET  /api/proyectos/:proyectoId/adaptacion
```

### Resultado

```text
POST /api/proyectos/:proyectoId/resultado/exportar
GET  /api/proyectos/:proyectoId/resultado
```

## Qué hacen ahora estas rutas

En este bloque las rutas:

```text
crean estado-proyecto.json
guardan videos originales por proyecto
actualizan etapaActual
registran solicitudes de etapa
guardan JSON de placeholder por etapa
permiten consultar estado y resultados guardados
```

## Qué no hacen todavía

Todavía no ejecutan los motores reales de cada etapa:

```text
entendimiento real
planificación real
producción maestro real
adaptación real
exportación final real
```

Eso se conectará en los siguientes bloques.

## Integración con servidor

Se conecta en:

```text
server/rutas-modulares.service.js
server.js
```

`server.js` entrega `upload` a las rutas modulares para que la API por etapas pueda recibir videos.

## Estado

```text
bloque: 5
nombre: API por etapas
estado: implementado
cambia_funcionamiento_legacy: no
siguiente_bloque: Entendimiento backend independiente
```
