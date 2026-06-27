# Bloque 7 - Pantalla Entendimiento

## Objetivo

Crear la pantalla visual de la etapa 1 del flujo profesional de AutoVideoJeff.

La pantalla permite revisar el resultado del backend de entendimiento antes de pasar al plan de edición.

## Archivos nuevos

```text
app/pantallas/entendimiento.view.js
app/etapas-ui/entendimiento-ui.js
app/entendimiento.css
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
botón Cargar entendimiento
botón Procesar entendimiento
orientación
duración
audio
fotogramas extraídos
momentos clave
listo para plan
transcripción
fotogramas clave
análisis global
necesidades antes del plan
botón Crear plan de edición
```

## Conexión con backend

La pantalla usa estas rutas:

```text
GET  /api/proyectos/:proyectoId/entendimiento
POST /api/proyectos/:proyectoId/entendimiento/procesar
POST /api/proyectos/:proyectoId/plan/procesar
```

El botón de plan queda conectado como solicitud base. El motor real del plan se desarrollará en el bloque correspondiente.

## Estado

```text
bloque: 7
nombre: Pantalla Entendimiento
estado: implementado
siguiente_bloque: Plan de edición backend
```
