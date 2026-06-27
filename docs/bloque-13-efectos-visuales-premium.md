# Bloque 13 - Efectos visuales premium

## Objetivo

Elevar el motor de efectos visuales para que AutoVideoJeff no solo seleccione efectos locales o por Gemini, sino que agregue una capa premium por perfil antes de compilar el filtro final de FFmpeg.

## Archivos nuevos

```text
editar/efectos/premium/efectos-premium.service.js
editar/efectos/premium/index.js
```

## Archivos modificados

```text
editar/efectos/efectos.conexion.js
server/rutas-modulares.service.js
```

## Qué hace la capa premium

La capa premium:

```text
lee el plan de efectos existente
identifica el perfil del proyecto
elige un paquete premium por perfil
agrega efectos base, de hook y de cierre
usa solo efectos con receta FFmpeg existente
respeta el máximo de efectos
ordena los efectos por tiempo y prioridad
marca la calidad premium del plan
guarda metadata de seguridad y señales usadas
```

## Paquetes premium creados

```text
premium-futbol
premium-anime
premium-educacion
premium-institucional
premium-historia
premium-cine
premium-general
```

Cada paquete define:

```text
idsBase
idsHook
idsCierre
intensidadBase
nombre del paquete
```

## Integración con producción

El motor principal ahora usa:

```text
planificarEfectos
mejorarPlanEfectosPremium
compilarPlanFfmpeg
registrarAuditoriaEfectos
```

El motor queda identificado como:

```text
efectos-premium-v2
```

## API nueva

```text
GET  /api/autovideo/efectos/premium
POST /api/autovideo/efectos/premium/previsualizar
```

La primera ruta lista paquetes premium. La segunda permite probar una capa premium con un plan o payload de prueba.

## Configuración

Por defecto, la capa premium está activa.

Se puede desactivar pasando:

```json
{
  "usarEfectosPremium": false
}
```

También se puede controlar el límite con:

```json
{
  "maxEfectosPremium": 14
}
```

## Estado

```text
bloque: 13
nombre: Efectos visuales premium
estado: implementado
siguiente_bloque: SFX premium
```
