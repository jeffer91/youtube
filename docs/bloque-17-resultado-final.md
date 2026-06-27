# Bloque 17 - Resultado final

## Objetivo

Conectar la quinta etapa real del flujo profesional de AutoVideoJeff: Resultado final.

Desde este bloque, la ruta:

```text
POST /api/proyectos/:proyectoId/resultado/exportar
```

dejó de ser placeholder y ahora consolida entendimiento, plan, producción y adaptación en un paquete final revisable.

## Archivos nuevos

```text
etapas/05-resultado/procesar-resultado-final.service.js
app/resultado-final.css
```

## Archivos modificados

```text
server/rutas-etapas.service.js
app/pantallas/resultado.view.js
app/resultado-final-ui.js
app/navegacion/menu.config.js
app/navegacion/navegacion-bootstrap.js
```

## Qué hace el backend

```text
carga estado-proyecto.json
carga 01-entendimiento/reporte-entendimiento.json
carga 02-plan/plan-edicion.json
carga 03-produccion/produccion.json
carga 04-adaptacion/adaptacion-plataformas.json
consolida video maestro
consolida versiones por plataforma
crea resumen final
crea checklist final
crea recomendaciones de publicación
crea manifest-publicacion.json
crea resultado-final.html
guarda 05-resultado/reporte-final.json
actualiza estado a FINALIZADO
```

## Resultado generado

El archivo estándar del flujo por etapas queda en:

```text
05-resultado/reporte-final.json
```

También se generan:

```text
05-resultado/resultado-final.html
05-resultado/manifest-publicacion.json
```

## Qué muestra la pantalla

```text
ID del proyecto
botón Cargar resultado
botón Generar resultado final
KPIs de plataformas, elementos, efectos, textos, peso y listo publicar
preview del video maestro
checklist final
versiones por plataforma
recomendaciones
publicación sugerida
entregables JSON, HTML y manifest
```

## API conectada

```text
GET  /api/proyectos/:proyectoId/resultado
POST /api/proyectos/:proyectoId/resultado/exportar
```

## Estado

```text
bloque: 17
nombre: Resultado final
estado: implementado
siguiente_bloque: Diagnóstico final y verificadores
```
