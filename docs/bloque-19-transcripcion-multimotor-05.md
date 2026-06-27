# Bloque 19.5 - Motor local gratuito Vosk español

## Objetivo

Agregar el tercer motor de transcripción gratuita/local: `Vosk`.

Este motor sirve como respaldo liviano cuando faster-whisper o whisper.cpp no estén disponibles.

## Archivos creados

```text
transcripcion/motores/vosk/vosk.service.js
transcripcion/motores/vosk/vosk_runner.py
scripts/verificar-bloque-19-transcripcion-multimotor-05.js
docs/bloque-19-transcripcion-multimotor-05.md
```

## Cómo trabaja

```text
1. Recibe entrada del proyecto.
2. Usa transcripciones/audio/audio-motores.wav.
3. Ejecuta un runner Python local.
4. El runner usa Vosk.
5. Lee el modelo Vosk desde una carpeta local.
6. Devuelve texto completo y segmentos.
7. Normaliza el resultado al formato multimotor.
8. Guarda resultado-vosk.json.
```

## Configuración esperada

Para que funcione realmente, la PC debe tener Python, Vosk y un modelo descargado.

Instalación de Vosk:

```bash
pip install vosk
```

Ruta del modelo:

```bash
AUTOVIDEOJEFF_VOSK_MODEL="C:\\ruta\\vosk-model-small-es"
```

También se puede enviar por opciones:

```text
voskModel
rutaModeloVosk
```

## Ventajas

```text
- Es gratuito.
- Es local.
- No necesita clave API.
- No necesita internet después de tener el modelo.
- Es más liviano que Whisper.
- Sirve como motor de emergencia.
```

## Limitación

Vosk puede ser menos preciso que faster-whisper en videos con ruido, música o varias voces. Por eso queda como tercer motor/respaldo.

## Qué NO hace todavía

```text
- No descarga el modelo Vosk automáticamente.
- No conecta Vosk al flujo de Entendimiento.
- No muestra todavía la transcripción en la UI.
```

## Siguiente bloque

Bloque 19.6: crear el gestor multimotor.

Ese gestor debe ejecutar los motores disponibles, guardar cada resultado, elegir la mejor transcripción y dejar preparada la transcripción principal.

## Criterio de aceptación

El verificador debe devolver:

```text
Bloque 19.5 OK: adaptador Vosk listo.
```
