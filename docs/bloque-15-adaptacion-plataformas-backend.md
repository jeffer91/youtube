# Bloque 15 - Adaptación a plataformas backend

## Objetivo

Conectar la cuarta etapa real del flujo profesional de AutoVideoJeff: Adaptación a plataformas.

Desde este bloque, la ruta:

```text
POST /api/proyectos/:proyectoId/adaptacion/procesar
```

dejó de ser placeholder y ahora toma el video maestro producido para generar salidas por plataforma.

## Archivo nuevo principal

```text
etapas/04-adaptacion/procesar-adaptacion-plataformas.service.js
```

## Qué hace el servicio

```text
carga estado-proyecto.json
carga 03-produccion/produccion.json
valida que exista el video maestro
resuelve plataformas solicitadas
prepara exportaciones por plataforma
crea resultado base por plataforma
renderiza plataformas pendientes
guarda 04-adaptacion/adaptacion-plataformas.json
actualiza estado a ADAPTADO
marca error controlado si falla
```

## Motores reutilizados

El bloque reutiliza:

```text
exportacion/preparar-exportaciones.service.js
exportacion/resultado-plataformas.service.js
exportacion/renderizar-plataforma.service.js
exportacion/renderizar-plataformas-pendientes.service.js
flujo-etapas/cargar-resultado-etapa.service.js
flujo-etapas/guardar-resultado-etapa.service.js
```

## Plataformas soportadas

Según la configuración actual de exportación:

```text
TikTok
Instagram Reels
YouTube Shorts
YouTube horizontal
Facebook
Instagram cuadrado
```

## Resultado generado

El archivo estándar del flujo por etapas queda en:

```text
04-adaptacion/adaptacion-plataformas.json
```

El resultado incluye:

```text
plataformas solicitadas
salida base del video maestro
exportaciones preparadas
resultado por plataforma
resumen ejecutivo
lectura de adaptación
estado listo para resultado final
```

## Cambio en API por etapas

Se actualizó:

```text
server/rutas-etapas.service.js
```

Ahora cuando la etapa solicitada es `adaptacion`, la ruta llama a:

```text
procesarAdaptacionPlataformasProyectoEtapa
```

La etapa de resultado final sigue como placeholder hasta su bloque correspondiente.

## Estado

```text
bloque: 15
nombre: Adaptación a plataformas backend
estado: implementado
siguiente_bloque: Pantalla Adaptación
```
