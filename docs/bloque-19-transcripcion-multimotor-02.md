# Bloque 19.2 - Audio único para motores de transcripción

## Objetivo

Preparar un solo archivo de audio limpio y estándar para que todos los motores de transcripción trabajen con la misma fuente.

Este bloque evita que cada motor extraiga audio por separado y reduce errores posteriores.

## Archivo creado

```text
transcripcion/servicios/preparar-audio-motores.service.js
```

## Verificador creado

```text
scripts/verificar-bloque-19-transcripcion-multimotor-02.js
```

## Estructura dentro del proyecto

Cuando se use este servicio, cada proyecto podrá guardar:

```text
transcripciones/
  audio/
    audio-motores.wav
    audio-motores.json
```

## Formato del audio

```text
Formato: WAV
Codec: pcm_s16le
Canales: 1
Frecuencia: 16000 Hz
Uso: transcripción local gratuita
```

## Fuentes aceptadas

El servicio busca la fuente en este orden:

```text
1. Ruta enviada por opciones
2. Audio mejorado, si existe
3. Video original del proyecto
```

## Qué resuelve

```text
- Centraliza el audio para faster-whisper.
- Centraliza el audio para whisper.cpp.
- Centraliza el audio para Vosk.
- Evita reprocesar si el WAV ya existe.
- Guarda metadata del audio preparado.
- Devuelve una fuente lista para motores.
```

## Qué NO hace todavía

```text
- No ejecuta faster-whisper.
- No ejecuta whisper.cpp.
- No ejecuta Vosk.
- No conecta todavía el gestor multimotor al flujo de Entendimiento.
- No modifica la pantalla de Entendimiento.
```

## Siguiente bloque

Bloque 19.3: crear el primer motor real gratuito local: faster-whisper.

Ese bloque debe crear el adaptador para ejecutar faster-whisper sobre:

```text
transcripciones/audio/audio-motores.wav
```

## Criterio de aceptación

El bloque queda correcto si existe un servicio capaz de convertir una fuente de audio o video a un WAV estándar para transcripción y si el verificador confirma:

```text
Bloque 19.2 OK: preparación de audio único para motores lista.
```
