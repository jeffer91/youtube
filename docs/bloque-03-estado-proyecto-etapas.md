# Bloque 3 - Estado de proyecto por etapas

## Objetivo

Crear la base técnica para que AutoVideoJeff deje de depender de un único procesamiento largo y pueda avanzar por etapas controladas.

Este bloque no cambia todavía la pantalla de Nuevo Proyecto ni las rutas API. Su función es preparar el control interno de estado que usarán los siguientes bloques.

## Flujo objetivo

```text
nuevo-proyecto
entendimiento
plan-edicion
produccion
adaptacion-plataformas
resultado
```

## Estados del proyecto

```text
creado
entendiendo
entendido
planificando
planificado
produciendo
producido
adaptando
adaptado
exportando
finalizado
error
```

## Archivos creados

```text
flujo-etapas/estado-proyecto.modelo.js
flujo-etapas/estado-proyecto.service.js
flujo-etapas/validar-transicion-etapa.service.js
flujo-etapas/guardar-resultado-etapa.service.js
flujo-etapas/cargar-resultado-etapa.service.js
flujo-etapas/flujo-etapas.conexion.js
```

## Qué hace cada archivo

### estado-proyecto.modelo.js

Define las etapas, estados, orden del flujo, carpetas estándar y archivo principal de cada etapa.

### validar-transicion-etapa.service.js

Evita saltos peligrosos entre etapas. Permite avanzar a la siguiente etapa, volver a una anterior para revisar o permanecer en la misma etapa.

### estado-proyecto.service.js

Permite crear, cargar, guardar, avanzar y marcar error en `estado-proyecto.json`.

### guardar-resultado-etapa.service.js

Guarda el resultado JSON de una etapa en su carpeta estándar.

### cargar-resultado-etapa.service.js

Carga el resultado JSON de una etapa si ya fue generado.

### flujo-etapas.conexion.js

Exporta todo desde un único punto para que los siguientes bloques puedan usar el nuevo control de etapas.

## Carpetas por etapa

```text
01-entendimiento/
02-plan/
03-produccion/
04-adaptacion/
05-resultado/
```

## Archivo de estado principal

Cada proyecto tendrá:

```text
estado-proyecto.json
```

Este archivo guardará:

```text
proyectoId
nombre
estado
etapaActual
etapaAnterior
siguienteEtapa
etapasCompletadas
etapasConError
archivosPorEtapa
historial
creadoEn
actualizadoEn
```

## Qué no cambia todavía

Este bloque todavía no conecta el nuevo estado a:

```text
server.js
entrada/subir-simple/subir.service.js
app/app.js
pantallas nuevas
rutas API por etapa
```

Eso se hará en los siguientes bloques.

## Criterio de aceptación

El bloque queda correcto si:

```text
existe flujo-etapas/estado-proyecto.modelo.js
existe flujo-etapas/estado-proyecto.service.js
existe flujo-etapas/validar-transicion-etapa.service.js
existe flujo-etapas/guardar-resultado-etapa.service.js
existe flujo-etapas/cargar-resultado-etapa.service.js
existe flujo-etapas/flujo-etapas.conexion.js
existe scripts/verificar-bloque-03-estado-etapas.js
package.json contiene check:bloque03-redisenio
```

## Estado

```text
bloque: 3
nombre: Estado de proyecto por etapas
estado: implementado
cambia_funcionamiento: no
siguiente_bloque: Nuevo Proyecto limpio
```
