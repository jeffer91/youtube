# Bloque 19.8 - UI de Entendimiento con transcripciones por motor

## Objetivo

Permitir que la pantalla de Entendimiento muestre varias transcripciones generadas por los motores locales.

Desde este bloque, la pantalla puede mostrar botones para cambiar entre:

```text
Principal
Manual
faster-whisper
whisper.cpp
Vosk
Gemini, si aparece en resultados futuros
```

## Archivos modificados

```text
app/pantallas/entendimiento.view.js
app/etapas-ui/entendimiento-ui.js
app/entendimiento.css
```

## Archivo creado

```text
scripts/verificar-bloque-19-transcripcion-multimotor-08.js
```

## Cambios visuales

La sección de transcripción ahora tiene:

```text
- Botones por motor.
- Estado por motor.
- Metadata del motor activo.
- Texto completo del motor activo.
- Segmentos del motor activo.
```

## Campos que lee la UI

```text
resultado.transcripcionPrincipal
resultado.transcripcionesPorMotor
resultado.resumenTranscripcion
resultado.transcripcion.transcripcionesPorMotor
```

## Comportamiento

```text
1. Al cargar/procesar entendimiento, se guarda el resultado actual en memoria UI.
2. Se crean opciones de transcripción desde la principal y desde cada motor.
3. Si existe Principal, se muestra primero.
4. Al hacer clic en un motor, cambia el texto mostrado sin reprocesar el video.
5. Si no hay motores, se muestra la transcripción base o el estado pendiente.
```

## Qué resuelve

```text
- Ya no se ve una sola transcripción fija.
- Se puede revisar qué devolvió cada motor.
- Se ve cuál fue la transcripción principal.
- Se muestran estados como OK, Vacía, Omitida, Error o Pendiente.
```

## Qué NO hace todavía

```text
- No permite elegir manualmente una transcripción como principal.
- No crea endpoints para guardar la selección manual.
- No instala modelos.
- No muestra diagnóstico técnico completo de motores faltantes.
```

## Siguiente bloque

Bloque 19.9: Diagnóstico de motores instalados/modelos faltantes.

Debe mostrar si falta:

```text
Python
faster-whisper
whisper.cpp
modelo whisper.cpp
Vosk
modelo Vosk
```

## Criterio de aceptación

El verificador debe devolver:

```text
Bloque 19.8 OK: UI de Entendimiento muestra transcripciones por motor.
```
