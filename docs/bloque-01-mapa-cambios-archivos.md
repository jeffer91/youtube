# Bloque 1 - Mapa de cambios por archivos

## Objetivo

Este documento define qué archivos actuales se conservarán, cuáles se modificarán y qué archivos nuevos serán necesarios para convertir AutoVideoJeff en una app de escritorio por etapas.

## Cambio central

El objetivo no es rehacer la app desde cero. El objetivo es reorganizar lo existente para que el proceso sea:

```text
1. Nuevo proyecto
2. Entendimiento
3. Plan de edición
4. Producción maestro
5. Adaptación a plataformas
6. Resultado final
```

## Archivos actuales que se modificarán

### Raíz

```text
package.json
main.js
preload.js
server.js
```

Cambios esperados:

```text
package.json -> scripts de verificación por etapa.
main.js -> ventana más orientada a escritorio profesional.
preload.js -> APIs seguras si se requieren acciones locales nuevas.
server.js -> rutas separadas por etapa y conservación de ruta legacy.
```

### App principal

```text
app/index.html
app/app.js
app/styles.css
```

Cambios esperados:

```text
index.html -> limpiar Nuevo Proyecto y preparar shell desktop.
app.js -> dejar de manejar todo como un único procesamiento.
styles.css -> compactar y profesionalizar distribución de escritorio.
```

### Navegación

```text
app/navegacion/menu.config.js
app/navegacion/navegacion.service.js
app/navegacion/navegacion-bootstrap.js
app/navegacion/navegacion.css
app/navegacion/submenus.service.js
app/navegacion/estado-pantalla.service.js
```

Cambios esperados:

```text
agregar Entendimiento
agregar Plan de edición
agregar Adaptación
ordenar flujo del proyecto
marcar etapa actual
bloquear o advertir pantallas sin etapa previa lista
```

### Pantallas actuales

```text
app/pantallas/inicio.view.js
app/pantallas/nuevo-proyecto.view.js
app/pantallas/procesado.view.js
app/pantallas/produccion.view.js
app/pantallas/resultado.view.js
app/pantallas/biblioteca.view.js
app/pantallas/historial.view.js
app/pantallas/perfiles.view.js
app/pantallas/ajustes.view.js
app/pantallas/diagnostico.view.js
app/pantallas/pantallas.conexion.js
```

Cambios esperados:

```text
nuevo-proyecto.view.js -> nombre + videos + procesar entendimiento.
procesado.view.js -> puede convertirse en monitor de etapa o eliminarse del flujo principal.
produccion.view.js -> antes/después + timeline profesional + inspector.
resultado.view.js -> versiones finales por plataforma.
pantallas.conexion.js -> exportar nuevas pantallas.
```

### UI existente que se adaptará

```text
app/produccion-revision-ui.js
app/produccion-revision.css
app/resultado-final-ui.js
app/resultado-plataformas-ui.js
app/resultado-plataformas.css
app/configuracion-proyecto-ui.js
app/historial-proyectos-ui.js
app/biblioteca-ui.js
app/diagnostico-fuerte-ui.js
app/auditoria-integral-ui.js
app/ajustes-gemini-ui.js
app/gemini-popup.js
app/progreso-real-ui.js
app/error-modal.js
```

Cambios esperados:

```text
progreso-real-ui.js -> progreso por etapa.
produccion-revision-ui.js -> timeline profesional por pistas.
resultado-plataformas-ui.js -> separar adaptación y resultado.
historial-proyectos-ui.js -> mostrar estado y etapa actual.
biblioteca-ui.js -> clasificar recursos por uso, tono, tipo y perfil.
diagnostico-fuerte-ui.js -> diagnóstico por etapa.
```

### Servidor

```text
server.js
server/rutas-modulares.service.js
```

Rutas nuevas esperadas:

```text
POST /api/proyectos
POST /api/proyectos/:id/videos
POST /api/proyectos/:id/entendimiento/procesar
GET  /api/proyectos/:id/entendimiento
POST /api/proyectos/:id/plan/procesar
GET  /api/proyectos/:id/plan
POST /api/proyectos/:id/produccion/procesar
GET  /api/proyectos/:id/produccion
POST /api/proyectos/:id/adaptacion/procesar
GET  /api/proyectos/:id/adaptacion
POST /api/proyectos/:id/resultado/exportar
GET  /api/proyectos/:id/resultado
```

La ruta actual debe quedar temporalmente como legacy:

```text
POST /api/procesar-video
```

### Motor principal

```text
motor/motor.conexion.js
motor/flujo-principal.js
motor/flujo-modular-autovideo.service.js
```

Cambios esperados:

```text
motor.conexion.js -> enrutar por etapa.
flujo-principal.js -> conservar como legacy o dividir gradualmente.
flujo-modular-autovideo.service.js -> usar para plan y producción, no para exportar todo al inicio.
```

### Entrada

```text
entrada/entrada.conexion.js
entrada/subir-simple/subir.service.js
```

Cambios esperados:

```text
soportar nombre de proyecto.
soportar uno o varios videos.
crear estructura de proyecto por etapas.
guardar estado-proyecto.json.
guardar videos-originales.json.
```

### Entendimiento

```text
entender/entender.conexion.js
entender/analisis-simple/analisis.service.js
entender/transcripcion-simple/transcripcion.service.js
entender/fotogramas/*
entender/analisis-video/*
entender/reporte-entendimiento/*
transcripcion/transcripcion.conexion.js
```

Cambios esperados:

```text
separar como primer procesado real.
guardar 01-entendimiento/.
mostrar resumen visual en pantalla Entendimiento.
conservar análisis técnico completo para etapas siguientes.
```

### Plan de edición

Archivos actuales reutilizables:

```text
motor/flujo-modular-autovideo.service.js
produccion/crear-plan-produccion.service.js
visual/visual.conexion.js
editar/efectos/*
editar/animaciones/*
biblioteca/*
aprendizaje/*
gemini/*
```

Cambios esperados:

```text
crear plan robusto sin renderizar.
seleccionar cortes, efectos, SFX, biblioteca y fallbacks.
guardar 02-plan/.
mostrar resumen simple para usuario.
```

### Producción maestro

```text
editar/editar.conexion.js
editar/tiktok-simple/tiktok.service.js
editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js
editar/edicion-dinamica/*
editar/animaciones/animaciones-render.service.js
salida/salida.conexion.js
salida/exportar-simple/exportar.service.js
salida/reporte-final/reporte-final.service.js
produccion/*
```

Cambios esperados:

```text
renderizar video maestro desde plan aprobado.
guardar 03-produccion/.
generar antes/después.
generar línea de producción.
generar auditoría de producción.
```

### Adaptación a plataformas

```text
exportacion/exportacion.conexion.js
exportacion/preparar-exportaciones.service.js
exportacion/renderizar-plataforma.service.js
exportacion/renderizar-plataformas-pendientes.service.js
exportacion/filtros-render-plataformas.service.js
exportacion/render-plataformas.config.js
exportacion/plataformas.config.js
```

Cambios esperados:

```text
mover elección de plataformas al final.
adaptar encuadre, textos, recursos, overlays y zonas seguras.
guardar 04-adaptacion/.
```

## Archivos nuevos requeridos

### Flujo por etapas

```text
flujo-etapas/estado-proyecto.modelo.js
flujo-etapas/estado-proyecto.service.js
flujo-etapas/validar-transicion-etapa.service.js
flujo-etapas/guardar-resultado-etapa.service.js
flujo-etapas/cargar-resultado-etapa.service.js
flujo-etapas/flujo-etapas.conexion.js
```

### Etapa 1 - Entendimiento

```text
etapas/01-entendimiento/procesar-entendimiento.service.js
etapas/01-entendimiento/guardar-entendimiento.service.js
etapas/01-entendimiento/resumen-entendimiento.service.js
```

### Etapa 2 - Plan de edición

```text
etapas/02-plan/procesar-plan-edicion.service.js
etapas/02-plan/crear-plan-robusto.service.js
etapas/02-plan/seleccionar-efectos-plan.service.js
etapas/02-plan/seleccionar-sfx-plan.service.js
etapas/02-plan/seleccionar-recursos-biblioteca.service.js
etapas/02-plan/crear-timeline-propuesta.service.js
etapas/02-plan/crear-riesgos-fallbacks.service.js
```

### Etapa 3 - Producción maestro

```text
etapas/03-produccion/procesar-produccion-maestro.service.js
etapas/03-produccion/crear-linea-produccion.service.js
etapas/03-produccion/crear-antes-despues-produccion.service.js
etapas/03-produccion/auditoria-produccion.service.js
etapas/03-produccion/guardar-produccion-maestro.service.js
```

### Etapa 4 - Adaptación

```text
etapas/04-adaptacion/procesar-adaptacion-plataformas.service.js
etapas/04-adaptacion/adaptar-encuadre-plataforma.service.js
etapas/04-adaptacion/adaptar-textos-plataforma.service.js
etapas/04-adaptacion/adaptar-recursos-plataforma.service.js
etapas/04-adaptacion/zonas-seguras-plataforma.service.js
etapas/04-adaptacion/crear-preview-plataforma.service.js
etapas/04-adaptacion/guardar-adaptacion.service.js
```

### Etapa 5 - Resultado

```text
etapas/05-resultado/exportar-resultado-final.service.js
etapas/05-resultado/preparar-descargas.service.js
etapas/05-resultado/reporte-final-etapas.service.js
```

### Nuevas pantallas

```text
app/pantallas/entendimiento.view.js
app/pantallas/plan-edicion.view.js
app/pantallas/adaptacion.view.js
```

### Nuevos controladores UI

```text
app/etapas-ui/estado-etapas-ui.js
app/etapas-ui/nuevo-proyecto-etapas-ui.js
app/etapas-ui/entendimiento-ui.js
app/etapas-ui/plan-edicion-ui.js
app/etapas-ui/produccion-maestro-ui.js
app/etapas-ui/adaptacion-plataformas-ui.js
app/etapas-ui/resultado-etapas-ui.js
app/etapas-ui/inspector-etapa-ui.js
```

### CSS nuevo

```text
app/desktop-shell.css
app/etapas-ui.css
app/entendimiento.css
app/plan-edicion.css
app/produccion-profesional.css
app/adaptacion-plataformas.css
app/resultado-final-etapas.css
```

### Premium visual y SFX

```text
editar/efectos-premium/efectos-premium.catalogo.js
editar/efectos-premium/seleccionar-efectos-premium.service.js
editar/efectos-premium/aplicar-efectos-premium.service.js
editar/efectos-premium/validar-efectos-premium.service.js
editar/efectos-premium/reporte-efectos-premium.service.js

editar/sfx-premium/sfx-premium.catalogo.js
editar/sfx-premium/seleccionar-sfx-premium.service.js
editar/sfx-premium/generar-sfx-sintetico.service.js
editar/sfx-premium/mezclar-sfx-premium.service.js
editar/sfx-premium/validar-sfx-premium.service.js
editar/sfx-premium/reporte-sfx-premium.service.js
```

### Verificadores

```text
scripts/verificar-flujo-etapas.js
scripts/verificar-nuevo-proyecto-etapas.js
scripts/verificar-entendimiento-etapa.js
scripts/verificar-plan-edicion-etapa.js
scripts/verificar-produccion-maestro-etapa.js
scripts/verificar-adaptacion-plataformas-etapa.js
scripts/verificar-resultado-final-etapas.js
scripts/verificar-ui-desktop-profesional.js
scripts/verificar-cierre-redisenio-etapas.js
```

## Orden de implementación aprobado

```text
Bloque 1: Auditoría y mapa del estado actual
Bloque 2: Shell profesional de escritorio
Bloque 3: Estado de proyecto por etapas
Bloque 4: Nuevo Proyecto limpio
Bloque 5: API por etapas
Bloque 6: Entendimiento backend independiente
Bloque 7: Pantalla Entendimiento
Bloque 8: Plan de edición backend
Bloque 9: Pantalla Plan de edición
Bloque 10: Producción maestro backend
Bloque 11: Producción profesional UI
Bloque 12: Biblioteca mejorada
Bloque 13: Efectos visuales premium
Bloque 14: SFX premium
Bloque 15: Adaptación a plataformas backend
Bloque 16: Pantalla Adaptación
Bloque 17: Resultado final
Bloque 18: Diagnóstico final y verificadores
```
