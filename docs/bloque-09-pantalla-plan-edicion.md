# Bloque 9 - Pantalla Plan de edición

## Objetivo

Crear la pantalla visual de la etapa 2 del flujo profesional de AutoVideoJeff.

La pantalla permite revisar el plan de edición antes de producir el video maestro.

## Archivos nuevos

```text
app/pantallas/plan-edicion.view.js
app/etapas-ui/plan-edicion-ui.js
app/plan-edicion.css
```

## Archivos modificados

```text
app/navegacion/menu.config.js
app/pantallas/pantallas.conexion.js
app/navegacion/navegacion.service.js
app/navegacion/navegacion-bootstrap.js
```

## Qué muestra la pantalla

```text
ID del proyecto
botón Cargar plan
botón Crear plan
resumen de elementos
subtítulos
textos
recursos
efectos
estado listo para producción
lectura editorial del plan
fuente desde entendimiento
línea de tiempo propuesta
lista revisable de elementos
botón Producir video maestro
```

## Conexión con backend

La pantalla usa estas rutas:

```text
GET  /api/proyectos/:proyectoId/plan
POST /api/proyectos/:proyectoId/plan/procesar
POST /api/proyectos/:proyectoId/produccion/procesar
```

El botón de producción queda conectado como solicitud base. El motor real de producción se desarrollará en el bloque correspondiente.

## Estado

```text
bloque: 9
nombre: Pantalla Plan de edición
estado: implementado
siguiente_bloque: Producción maestro backend
```
