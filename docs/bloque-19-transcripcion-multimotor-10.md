# Bloque 19.10 - Descarga/instalación guiada de modelos gratuitos

## Objetivo

Agregar una guía interna para instalar y configurar motores gratuitos/locales de transcripción.

La idea es que AutoVideoJeff no dependa de Gemini ni de APIs pagadas para transcribir.

## Archivos creados

```text
transcripcion/motores/instalacion-guiada-motores.service.js
scripts/preparar-carpetas-modelos-transcripcion.js
scripts/verificar-bloque-19-transcripcion-multimotor-10.js
docs/bloque-19-transcripcion-multimotor-10.md
```

## Archivos modificados

```text
server/rutas-modulares.service.js
app/pantallas/entendimiento.view.js
app/etapas-ui/entendimiento-ui.js
app/entendimiento.css
```

## Endpoint agregado

```text
GET /api/autovideo/transcripcion/motores/instalacion
```

## Botón agregado en Entendimiento

```text
Guía instalación
```

## Qué muestra la guía

```text
- Pasos para verificar Python.
- Instalación de faster-whisper.
- Configuración de whisper.cpp.
- Instalación de Vosk español.
- Variables de entorno necesarias.
- Comandos recomendados.
- Qué revisar si falla cada paso.
```

## Variables incluidas

```text
AUTOVIDEOJEFF_PYTHON
AUTOVIDEOJEFF_WHISPER_CPP
AUTOVIDEOJEFF_WHISPER_CPP_MODEL
AUTOVIDEOJEFF_VOSK_MODEL
```

## Script agregado

```bash
node scripts/preparar-carpetas-modelos-transcripcion.js
```

Este script crea carpetas locales para modelos y binarios:

```text
datos/modelos/transcripcion
datos/modelos/transcripcion/faster-whisper
datos/modelos/transcripcion/whisper-cpp
datos/modelos/transcripcion/vosk
datos/binarios/transcripcion
datos/binarios/transcripcion/whisper-cpp
```

## Importante

Este bloque no descarga archivos automáticamente. Es una instalación guiada segura y manual para evitar descargas no verificadas, rutas incorrectas o archivos pesados dentro del repositorio.

## Siguiente bloque

Bloque 19.11: selección manual de transcripción principal.

Debe permitir que el usuario elija desde la UI cuál transcripción usar como principal.

## Criterio de aceptación

El verificador debe devolver:

```text
Bloque 19.10 OK: instalación guiada de motores gratuitos disponible.
```
