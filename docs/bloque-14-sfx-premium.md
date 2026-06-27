# Bloque 14 - SFX premium

## Objetivo

Elevar el motor de sonidos de edición para que AutoVideoJeff no solo mezcle sonidos básicos, sino que aplique una capa de SFX premium por perfil, sincronizada con eventos visuales y efectos premium.

## Archivos nuevos

```text
editar/edicion-dinamica/sonidos/premium/sfx-premium.service.js
editar/edicion-dinamica/sonidos/premium/index.js
```

## Archivos modificados

```text
editar/edicion-dinamica/sonidos/sonidos.conexion.js
server/rutas-modulares.service.js
```

## Qué hace la capa SFX premium

La capa SFX premium:

```text
lee eventos de sonido creados desde eventos visuales
identifica el perfil del proyecto
selecciona un paquete SFX premium
ajusta tipo de sonido por hook, texto, zoom, overlay, intro y cierre
ajusta volumen de forma segura
agrega eventos extra desde efectos visuales premium
respeta inicio seguro
respeta separación mínima entre sonidos
respeta máximo de eventos
usa solo sonidos base ya generables por FFmpeg
guarda metadata de calidad SFX
```

## Paquetes SFX creados

```text
sfx-premium-futbol
sfx-premium-anime
sfx-premium-educacion
sfx-premium-institucional
sfx-premium-historia
sfx-premium-cine
sfx-premium-general
```

## Integración en producción

El flujo de audio ahora es:

```text
crearEventosSonido
mejorarEventosSonidoPremium
generarSonidosBase
validarSonidosEdicion
mezclarSonidosEdicion
```

El resultado guarda:

```text
eventos-sonido-base.json
eventos-sonido.json
sfx-premium.json
sonidos-base.json
validacion-sonidos.json
resultado-sonidos.json
```

## API nueva

```text
GET  /api/autovideo/sfx/premium
POST /api/autovideo/sfx/premium/previsualizar
```

La primera ruta lista paquetes SFX premium. La segunda permite probar un paquete SFX con eventos de ejemplo o payload real.

## Configuración

Por defecto, la capa SFX premium está activa.

Se puede desactivar con:

```json
{
  "usarSfxPremium": false
}
```

## Estado

```text
bloque: 14
nombre: SFX premium
estado: implementado
siguiente_bloque: Adaptación a plataformas backend
```
