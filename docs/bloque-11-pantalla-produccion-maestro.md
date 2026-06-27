# Bloque 11 - Pantalla Producción maestro

## Objetivo

Crear la pantalla visual de la etapa 3 del flujo profesional de AutoVideoJeff.

La pantalla permite producir, cargar y revisar el video maestro antes de adaptar a plataformas.

## Archivos nuevos

```text
app/etapas-ui/produccion-maestro-ui.js
app/produccion-maestro.css
```

## Archivos modificados

```text
app/pantallas/produccion.view.js
app/navegacion/navegacion-bootstrap.js
app/navegacion/menu.config.js
```

## Qué muestra la pantalla

```text
ID del proyecto
botón Cargar producción
botón Producir video maestro
nombre del video maestro
peso del archivo
modo de render
plataforma base
elementos usados del plan
estado listo para adaptación
preview del video maestro
botón de descarga
comparación antes/después
timeline de elementos usados
auditoría de producción
detalle profesional del plan usado
botón Adaptar a plataformas
```

## Conexión con backend

La pantalla usa estas rutas:

```text
GET  /api/proyectos/:proyectoId/produccion
POST /api/proyectos/:proyectoId/produccion/procesar
POST /api/proyectos/:proyectoId/adaptacion/procesar
```

El botón de adaptación queda conectado como solicitud base. El motor real de adaptación se desarrollará en el bloque correspondiente.

## Compatibilidad

La pantalla mantiene un bloque oculto con IDs legacy de Producción para que el controlador anterior no rompa mientras migramos toda la app al flujo por etapas.

## Estado

```text
bloque: 11
nombre: Pantalla Producción maestro
estado: implementado
siguiente_bloque: Biblioteca mejorada / recursos para producción
```
