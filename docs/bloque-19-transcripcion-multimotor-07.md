# Bloque 19.7 - Conectar transcripción multimotor con Entendimiento

## Objetivo

Hacer que la etapa de Entendimiento use el gestor multimotor de transcripción.

Desde este bloque, Entendimiento ya puede recibir una transcripción principal generada por el gestor y conservar los resultados de cada motor para mostrarlos después en la UI.

## Archivos modificados

```text
entender/entender.conexion.js
entender/etapas/entendimiento-etapa.service.js
```

## Archivos creados

```text
scripts/verificar-bloque-19-transcripcion-multimotor-07.js
docs/bloque-19-transcripcion-multimotor-07.md
```

## Nuevo flujo

```text
1. Entendimiento analiza el video.
2. Revisa si hay transcripción manual.
3. Si no hay texto manual, ejecuta el gestor multimotor.
4. El gestor prepara audio único.
5. El gestor intenta los motores locales disponibles.
6. Entendimiento recibe transcripción principal.
7. Entendimiento conserva transcripciones por motor.
8. Si multimotor no produce texto, mantiene fallback legacy.
```

## Campos nuevos en resultado de Entendimiento

```text
transcripcionPrincipal
transcripcionesPorMotor
resumenTranscripcion
```

También se agregan al resumen:

```text
motorTranscripcionPrincipal
transcripcionesGeneradas
```

## Importante

Este bloque conecta el backend. Todavía no cambia la pantalla para navegar entre transcripciones.

La UI de Entendimiento se hará en el siguiente bloque.

## Qué resuelve

```text
- Entendimiento ya no depende solo de Gemini.
- Entendimiento puede usar motores locales gratuitos.
- Se conserva el resultado de cada motor.
- Se mantiene compatibilidad con el módulo legacy.
- El análisis editorial sigue leyendo transcripcion.textoCompleto.
```

## Qué NO hace todavía

```text
- No muestra botones por motor en la pantalla.
- No permite elegir manualmente la transcripción principal.
- No descarga ni instala modelos.
```

## Siguiente bloque

Bloque 19.8: UI de Entendimiento con botones por transcripción.

La pantalla debe permitir ver:

```text
[Principal] [manual] [faster-whisper] [whisper.cpp] [Vosk] [Gemini]
```

## Criterio de aceptación

El verificador debe devolver:

```text
Bloque 19.7 OK: Entendimiento conectado al gestor multimotor.
```
