# Bloque 19.6 - Gestor multimotor de transcripción

## Objetivo

Crear el orquestador que ejecuta varios motores de transcripción, guarda los resultados y selecciona una transcripción principal.

Este bloque todavía no conecta el gestor al flujo de Entendimiento. Esa conexión se realizará en el siguiente bloque.

## Archivo creado

```text
transcripcion/motores/gestor-motores-transcripcion.service.js
```

## Verificador creado

```text
scripts/verificar-bloque-19-transcripcion-multimotor-06.js
```

## Motores gestionados

```text
manual
faster-whisper
whisper.cpp
vosk
gemini opcional/no obligatorio
```

## Cómo trabaja

```text
1. Lee la configuración multimotor.
2. Verifica motores disponibles.
3. Prepara el audio único para motores.
4. Ejecuta cada motor en orden.
5. Cada error queda aislado por motor.
6. Guarda cada resultado por separado.
7. Selecciona automáticamente la mejor transcripción.
8. Guarda transcripcion-principal.json.
9. Guarda resumen-motores.json.
```

## Regla importante

Gemini queda como opcional. El gestor gratuito no lo usa como dependencia obligatoria.

## Salidas esperadas

Cuando se conecte al flujo, cada proyecto podrá tener:

```text
transcripciones/
  audio/
    audio-motores.wav
    audio-motores.json
  motores/
    manual/transcripcion.json
    faster-whisper/transcripcion.json
    whisper-cpp/transcripcion.json
    vosk/transcripcion.json
  principal/
    transcripcion-principal.json
  resumen-motores.json
```

## Funciones principales

```text
verificarMotoresTranscripcion()
procesarTranscripcionMultimotor()
```

## Qué resuelve

```text
- Ya existe un punto único para ejecutar motores.
- No se cae todo si falla un motor.
- Se guarda el resultado de cada motor.
- Se elige una transcripción principal.
- Se prepara la base para mostrar varias transcripciones en Entendimiento.
```

## Qué NO hace todavía

```text
- No reemplaza todavía la transcripción actual de Entendimiento.
- No modifica UI.
- No agrega endpoints para elegir manualmente una transcripción.
- No instala modelos.
```

## Siguiente bloque

Bloque 19.7: conectar el gestor multimotor con Entendimiento.

Ese bloque debe hacer que la etapa de Entendimiento use `procesarTranscripcionMultimotor()` y que entregue:

```text
transcripcionPrincipal
transcripcionesPorMotor
resumenTranscripcion
```

## Criterio de aceptación

El verificador debe devolver:

```text
Bloque 19.6 OK: gestor multimotor listo.
```
