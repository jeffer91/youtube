# Bloque 19.3 - Motor local gratuito faster-whisper

## Objetivo

Agregar el primer motor real de transcripción gratuita local: `faster-whisper`.

Este bloque crea el adaptador, pero todavía no lo conecta automáticamente al flujo completo de Entendimiento. La conexión general se hará en el bloque del gestor multimotor.

## Archivos creados

```text
transcripcion/motores/faster-whisper/faster-whisper.service.js
transcripcion/motores/faster-whisper/faster_whisper_runner.py
scripts/verificar-bloque-19-transcripcion-multimotor-03.js
docs/bloque-19-transcripcion-multimotor-03.md
```

## Cómo trabaja

```text
1. Recibe entrada del proyecto.
2. Usa el audio único preparado en el bloque 19.2.
3. Ejecuta un runner Python local.
4. El runner usa faster-whisper.
5. Devuelve texto completo y segmentos.
6. Normaliza el resultado al formato multimotor.
7. Guarda resultado-faster-whisper.json.
```

## Requisito en la PC

Para que este motor funcione realmente, la computadora debe tener Python y faster-whisper instalado:

```bash
pip install faster-whisper
```

Si hay varias instalaciones de Python, se puede indicar una ruta mediante variable de entorno:

```bash
AUTOVIDEOJEFF_PYTHON="C:\\Ruta\\A\\python.exe"
```

## Modelo predeterminado

```text
Modelo: small
Idioma: es
Device: cpu
Compute type: int8
```

Se eligió `small` como punto medio entre peso, calidad y velocidad.

## Qué NO hace todavía

```text
- No descarga modelos automáticamente.
- No instala Python.
- No conecta faster-whisper como motor principal de Entendimiento.
- No muestra todavía varias transcripciones en la UI.
```

## Siguiente bloque

Bloque 19.4: agregar motor local gratuito `whisper.cpp` como segundo motor/respaldo.

## Criterio de aceptación

El verificador debe devolver:

```text
Bloque 19.3 OK: adaptador faster-whisper listo.
```
