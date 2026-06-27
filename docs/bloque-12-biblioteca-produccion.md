# Bloque 12 - Biblioteca mejorada / recursos para producción

## Objetivo

Mejorar la biblioteca para que no sea solo un listado de recursos, sino una herramienta que recomiende recursos útiles para el proyecto según el entendimiento y el plan de edición.

## Archivos nuevos

```text
biblioteca/seleccionar-recursos-produccion.service.js
```

## Archivos modificados

```text
biblioteca/biblioteca.conexion.js
server/rutas-modulares.service.js
app/pantallas/biblioteca.view.js
app/biblioteca-ui.js
app/biblioteca-ui.css
```

## Qué hace el backend

El servicio nuevo:

```text
carga 01-entendimiento/reporte-entendimiento.json
carga 02-plan/plan-edicion.json
lee los elementos del plan
lee necesidades del entendimiento
analiza recursos de biblioteca
puntúa recursos por tipo, perfil, categoría, etiquetas, tono, momento, licencia y estado
crea sugerencias por necesidad
marca riesgos como licencia pendiente o recurso sin ruta
crea resumen ejecutivo
guarda 02-plan/biblioteca-sugerencias.json
```

## Ruta nueva

```text
POST /api/proyectos/:proyectoId/biblioteca/recomendar
GET  /api/proyectos/:proyectoId/biblioteca/recomendar
```

La ruta `POST` guarda el resultado para el proyecto.
La ruta `GET` permite previsualizar recomendaciones sin guardar.

## Qué muestra la pantalla

En Biblioteca ahora aparece un panel nuevo llamado:

```text
Recursos para producción
Recomendador por proyecto
```

Muestra:

```text
ID del proyecto
consulta opcional
límite por necesidad
necesidades analizadas
recursos analizados
sugerencias generadas
necesidades sin recurso
cards con recursos sugeridos
puntaje del recurso
razones de selección
riesgos detectados
```

## Estado

```text
bloque: 12
nombre: Biblioteca mejorada / recursos para producción
estado: implementado
siguiente_bloque: Efectos visuales premium
```
