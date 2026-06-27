# Bloque 19.1 - Base de transcripción multimotor

## Objetivo

Preparar AutoVideoJeff para manejar varias transcripciones del mismo proyecto sin romper el flujo actual de Entendimiento.

Este bloque no conecta todavía faster-whisper, whisper.cpp ni Vosk. Solo deja lista la base técnica para guardar, cargar, comparar y elegir transcripciones por motor.

## Decisión central

La transcripción ya no debe tratarse como un único texto. Debe manejarse como un conjunto de resultados por motor:

```text
transcripciones/
  motores/
    manual/transcripcion.json
    faster-whisper/transcripcion.json
    whisper-cpp/transcripcion.json
    vosk/transcripcion.json
    gemini/transcripcion.json
  principal/
    transcripcion-principal.json
  resumen-motores.json
```

## Motores previstos

```text
1. manual
2. faster-whisper
3. whisper.cpp
4. vosk
5. gemini opcional
```

Los tres motores principales para uso gratuito/local serán:

```text
faster-whisper
whisper.cpp
vosk
```

Gemini queda como opcional para apoyo inteligente, no como dependencia obligatoria.

## Archivos creados

```text
transcripcion/modelos/transcripcion-normalizada.modelo.js
transcripcion/motores/motores-transcripcion.config.js
transcripcion/servicios/guardar-resultados-motores.service.js
transcripcion/servicios/cargar-resultados-motores.service.js
docs/bloque-19-transcripcion-multimotor-01.md
```

## Qué resuelve este bloque

```text
- Define motores de transcripción oficiales.
- Define estados normalizados: ok, vacia, omitida, error, pendiente.
- Define estructura estándar para segmentos.
- Define estructura estándar para resultado por motor.
- Define guardado por motor.
- Define transcripción principal.
- Define resumen de motores.
- Permite cargar resultados para futura pantalla de Entendimiento.
```

## Qué NO hace todavía

```text
- No instala modelos.
- No ejecuta faster-whisper.
- No ejecuta whisper.cpp.
- No ejecuta Vosk.
- No modifica todavía la UI de Entendimiento.
- No cambia todavía el flujo principal de transcripción.
```

## Siguiente bloque

Bloque 19.2: preparar audio único para motores.

Ese bloque debe crear un audio limpio estándar para que todos los motores trabajen con el mismo archivo.

Formato esperado:

```text
WAV
mono
16 kHz
ruta fija dentro del proyecto
```

## Criterio de aceptación

El bloque queda correcto si la app puede importar los nuevos servicios sin afectar el flujo actual y si existe una estructura clara para guardar varias transcripciones por proyecto.
