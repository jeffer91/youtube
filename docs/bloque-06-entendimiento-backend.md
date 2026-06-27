# Bloque 6 - Entendimiento backend independiente

## Objetivo

Conectar la primera etapa real del nuevo flujo por etapas: Entendimiento.

Desde este bloque, la ruta:

```text
POST /api/proyectos/:proyectoId/entendimiento/procesar
```

dejó de ser solamente un placeholder y ahora ejecuta el backend real de entendimiento.

## Archivo nuevo principal

```text
entender/etapas/entendimiento-etapa.service.js
```

Este servicio se encarga de:

```text
cargar estado-proyecto.json
leer videos-originales.json
seleccionar el video principal del proyecto
construir la entrada compatible con entenderVideo
actualizar estado a ENTENDIENDO
ejecutar entenderVideo
guardar resultado estándar en 01-entendimiento/reporte-entendimiento.json
actualizar estado a ENTENDIDO
marcar error controlado si falla
```

## Qué motor usa

El servicio usa la conexión existente:

```text
entender/entender.conexion.js
```

Ese motor ejecuta:

```text
análisis técnico
transcripción simple
fotogramas clave
análisis editorial
reporte de entendimiento
```

## Archivos que genera

Dentro del proyecto se mantienen los archivos internos existentes:

```text
analisis-simple.json
transcripcion-simple.json
entendimiento/fotogramas-clave.json
entendimiento/analisis-editorial-video.json
entendimiento/reporte-entendimiento.json
```

Y además se genera el archivo estándar del flujo por etapas:

```text
01-entendimiento/reporte-entendimiento.json
```

## Cambio en API por etapas

Se actualizó:

```text
server/rutas-etapas.service.js
```

Ahora cuando la etapa solicitada es `entendimiento`, la ruta llama a:

```text
procesarEntendimientoProyectoEtapa
```

Las demás etapas siguen como placeholder hasta sus bloques respectivos.

## Qué no cambia todavía

Todavía no se cambia la pantalla visual de Entendimiento.

Este bloque solo deja listo el backend para que después una pantalla pueda leer:

```text
GET /api/proyectos/:proyectoId/entendimiento
```

## Estado

```text
bloque: 6
nombre: Entendimiento backend independiente
estado: implementado
siguiente_bloque: Pantalla Entendimiento
```
