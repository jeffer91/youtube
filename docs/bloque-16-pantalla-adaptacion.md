# Bloque 16 - Pantalla Adaptación

## Objetivo

Crear la pantalla visual de la etapa 4 del flujo profesional de AutoVideoJeff.

La pantalla permite cargar, procesar y revisar las versiones finales por plataforma antes del resultado final.

## Archivos nuevos

```text
app/pantallas/adaptacion.view.js
app/etapas-ui/adaptacion-ui.js
app/adaptacion.css
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
botón Cargar adaptación
botón Adaptar plataformas
selector de plataformas
opción renderizar también la base
KPIs de total, exportadas, pendientes, errores, peso total y listo resultado
preview del video maestro base
lectura de adaptación
cards por plataforma con preview, estado, formato, peso y archivo
exportaciones preparadas
botón Preparar resultado final
```

## Conexión con backend

La pantalla usa estas rutas:

```text
GET  /api/proyectos/:proyectoId/adaptacion
POST /api/proyectos/:proyectoId/adaptacion/procesar
POST /api/proyectos/:proyectoId/resultado/exportar
```

El botón de resultado final queda conectado como solicitud base. El motor real de resultado final se desarrollará en el bloque correspondiente.

## Estado

```text
bloque: 16
nombre: Pantalla Adaptación
estado: implementado
siguiente_bloque: Resultado final
```
