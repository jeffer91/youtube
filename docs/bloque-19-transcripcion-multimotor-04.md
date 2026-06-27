# Bloque 19.4 - Motor local gratuito whisper.cpp

## Objetivo

Agregar el segundo motor de transcripción gratuita/local: `whisper.cpp`.

Este bloque crea el adaptador para usar un binario local de whisper.cpp sobre el audio preparado en el bloque 19.2.

## Archivos creados

```text
transcripcion/motores/whisper-cpp/whisper-cpp.service.js
scripts/verificar-bloque-19-transcripcion-multimotor-04.js
docs/bloque-19-transcripcion-multimotor-04.md
```

## Cómo trabaja

```text
1. Recibe entrada del proyecto.
2. Usa transcripciones/audio/audio-motores.wav.
3. Ejecuta un binario local de whisper.cpp.
4. Solicita salida JSON y TXT.
5. Lee raw-whisper-cpp.json o raw-whisper-cpp.txt.
6. Normaliza segmentos y texto completo.
7. Guarda resultado-whisper-cpp.json.
```

## Configuración esperada

Para que este motor funcione realmente, la PC debe tener un ejecutable de whisper.cpp y un modelo `.bin`.

Se puede configurar con variables de entorno:

```bash
AUTOVIDEOJEFF_WHISPER_CPP="C:\\ruta\\whisper-cli.exe"
AUTOVIDEOJEFF_WHISPER_CPP_MODEL="C:\\ruta\\ggml-small.bin"
```

También se puede enviar por opciones:

```text
whisperCppExecutable
whisperCppModel
rutaModeloWhisperCpp
```

## Qué resuelve

```text
- Agrega un segundo motor local gratuito.
- No depende de Python.
- No necesita clave API.
- No necesita internet cuando el binario y modelo ya existen.
- Sirve como respaldo de faster-whisper.
```

## Qué NO hace todavía

```text
- No descarga whisper.cpp.
- No descarga modelos .bin.
- No conecta el motor al flujo de Entendimiento.
- No muestra la transcripción en la UI.
```

## Siguiente bloque

Bloque 19.5: agregar motor local gratuito Vosk español.

## Criterio de aceptación

El verificador debe devolver:

```text
Bloque 19.4 OK: adaptador whisper.cpp listo.
```
