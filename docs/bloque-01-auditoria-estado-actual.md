# Bloque 1 - Auditoría del estado actual de AutoVideoJeff

## Objetivo del bloque

Este bloque documenta cómo está la app antes del rediseño por etapas. No cambia todavía el funcionamiento visual ni el flujo de procesamiento. Su función es dejar una base técnica clara para que los siguientes bloques se implementen sin romper lo que ya existe.

## Estado general actual

AutoVideoJeff es una app local de escritorio basada en Electron + Express + FFmpeg. Electron inicia la ventana principal y el servidor local interno. Express expone la interfaz y las rutas API. FFmpeg/FFprobe se usan para análisis, edición y exportación.

La app ya tiene una arquitectura modular amplia, con módulos para entrada, entendimiento, audio, transcripción, edición dinámica, efectos, sonidos, producción, biblioteca, exportación, diagnóstico y resultado final.

## Flujo actual detectado

El flujo actual principal es monolítico desde el punto de vista del usuario:

```text
Subir video -> procesar todo -> exportar -> revisar producción/resultado
```

En la práctica, el flujo del motor ejecuta casi todo en una sola solicitud:

```text
entrada
entender
audio
transcripcion
edicion-dinamica
editar
salida
exportacion-plataformas
reporte-final
```

Esto permite que la app produzca un resultado final, pero dificulta probar cada fase por separado. Si una fase falla, el usuario no puede revisar claramente qué se generó antes del fallo.

## Punto crítico del rediseño

El flujo debe pasar a una arquitectura por etapas:

```text
crear proyecto -> entender -> planificar -> producir maestro -> adaptar plataformas -> resultado
```

Cada etapa debe guardar su propio resultado, mostrarlo en pantalla y permitir avanzar a la siguiente etapa de forma controlada.

## Pantallas actuales

La navegación actual incluye:

```text
Inicio
Nuevo proyecto
Biblioteca
Producción
Historial
Perfiles
Ajustes
Diagnóstico
```

Faltan pantallas clave para el nuevo flujo:

```text
Entendimiento
Plan de edición
Adaptación a plataformas
```

## Nuevo Proyecto actual

La pantalla actual de Nuevo Proyecto contiene demasiadas decisiones al inicio:

```text
subir video
perfil
modo
exportar todo
plataformas
opciones avanzadas
audio
transcripcion
Gemini
subtitulos
textos
```

En el rediseño debe quedar limpia:

```text
nombre del proyecto
subir uno o varios videos
procesar entendimiento
```

Las plataformas se elegirán al final, en Adaptación a plataformas.

## Módulos que se conservan

Se conserva la base actual porque ya tiene módulos valiosos:

```text
Electron
Express
FFmpeg/FFprobe
progreso real
diagnóstico
entrada
entendimiento
transcripción
Gemini/fallback local
audio
edición dinámica
efectos
animaciones
sonidos
producción
biblioteca
exportación por plataformas
resultado final
```

## Módulos que necesitan reordenamiento

No se deben borrar. Deben reordenarse para trabajar por etapas:

```text
server.js
motor/flujo-principal.js
motor/motor.conexion.js
motor/flujo-modular-autovideo.service.js
entrada/*
entender/*
transcripcion/*
editar/*
produccion/*
exportacion/*
salida/*
app/*
```

## Problemas actuales que resuelve el rediseño

1. El usuario no puede probar entendimiento antes de editar.
2. La app planifica, edita, renderiza y exporta en una sola cadena larga.
3. Las plataformas se eligen demasiado temprano.
4. La primera pantalla está sobrecargada.
5. Producción ya existe, pero necesita convertirse en una pantalla de revisión profesional.
6. La exportación por plataformas debe ser una etapa final de adaptación, no una decisión inicial.
7. El resultado técnico interno es fuerte, pero la experiencia del usuario debe simplificarse.

## Criterio de aceptación del Bloque 1

Este bloque queda completo si existen:

```text
docs/bloque-01-auditoria-estado-actual.md
docs/bloque-01-mapa-cambios-archivos.md
scripts/verificar-bloque-01-redisenio-etapas.js
script npm check:bloque01-redisenio
```

## Estado del bloque

```text
bloque: 1
nombre: Auditoría y mapa del estado actual
estado: documentado
cambia_funcionamiento: no
siguiente_bloque: Shell profesional de escritorio
```
