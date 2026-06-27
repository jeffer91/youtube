# Bloque 4 - Nuevo Proyecto limpio

## Objetivo

Simplificar la primera pantalla de AutoVideoJeff para que el usuario no tome decisiones técnicas al inicio.

La pantalla inicial debe enfocarse solo en:

```text
nombre del proyecto
subir uno o varios videos
procesar entendimiento
```

Las plataformas, formatos y adaptaciones se elegirán al final del flujo, no al inicio.

## Cambios aplicados

### 1. Pantalla inicial simplificada

Se actualizó:

```text
app/index.html
```

Ahora la pantalla principal muestra:

```text
Nombre del proyecto
Subir video o varios videos
Botón Procesar entendimiento
Panel lateral con flujo por etapas
Aviso de que las plataformas van al final
```

### 2. Controles técnicos ocultos

Los controles anteriores de perfil, plataformas, audio, transcripción, Gemini y efectos se mantienen ocultos para no romper el flujo legacy mientras se implementan las rutas por etapas.

Esto permite que los módulos existentes sigan funcionando internamente mientras la primera pantalla ya queda limpia.

### 3. Estilos propios del bloque

Se creó:

```text
app/nuevo-proyecto-limpio.css
```

Incluye estilos para:

```text
pantalla limpia
grilla principal
nombre de proyecto
zona de carga de videos
panel lateral de etapas
mensaje de plataformas al final
ocultamiento de controles legacy
```

### 4. App JS adaptado

Se actualizó:

```text
app/app.js
```

Ahora:

```text
lee projectNameInput
permite selección múltiple en el input de video
muestra resumen de uno o varios videos seleccionados
envía nombreProyecto
envía cantidadVideosProyecto
envía videosSeleccionadosJson
envía etapaSolicitada=entendimiento
cambia el botón a Procesar entendimiento
```

### 5. Tarjeta de navegación actualizada

Se actualizó:

```text
app/pantallas/nuevo-proyecto.view.js
```

para reflejar que la pantalla inicial ahora es:

```text
Nombre
Video(s)
Entendimiento
Sin plataformas aún
```

## Límite temporal del bloque

Este bloque todavía conserva la ruta legacy:

```text
POST /api/procesar-video
```

Por eso, aunque la pantalla ya dice "Procesar entendimiento", la separación real del backend se conectará en los bloques siguientes:

```text
Bloque 5: API por etapas
Bloque 6: Entendimiento backend independiente
```

## Criterio de aceptación

El bloque queda correcto si:

```text
index.html incluye projectNameInput
index.html permite input multiple
index.html ya no muestra plataformas visibles en la primera pantalla
app.js envía nombreProyecto
app.js envía etapaSolicitada=entendimiento
app/nuevo-proyecto-limpio.css existe
scripts/verificar-bloque-04-nuevo-proyecto-limpio.js existe
package.json contiene check:bloque04-redisenio
```

## Estado

```text
bloque: 4
nombre: Nuevo Proyecto limpio
estado: implementado
cambia_funcionamiento: visual y formulario inicial
siguiente_bloque: API por etapas
```
