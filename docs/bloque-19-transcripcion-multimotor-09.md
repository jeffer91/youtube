# Bloque 19.9 - Diagnóstico de motores instalados/modelos faltantes

## Objetivo

Agregar un diagnóstico visible para saber si la computadora puede transcribir gratis con motores locales.

Este bloque revisa:

```text
Python
faster-whisper
whisper.cpp
modelo whisper.cpp
Vosk
modelo Vosk
```

## Archivos creados

```text
transcripcion/motores/diagnostico-motores-transcripcion.service.js
scripts/verificar-bloque-19-transcripcion-multimotor-09.js
docs/bloque-19-transcripcion-multimotor-09.md
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
GET /api/autovideo/transcripcion/motores/diagnostico
```

## Qué muestra el diagnóstico

```text
- Motor
- Estado
- Mensaje técnico entendible
- Si es gratuito
- Si es local
- Rutas detectadas
- Acciones recomendadas
```

## Estados posibles

```text
listo
falta_modelo
falta_python_o_paquete
falta_paquete
requiere_configuracion
opcional
```

## Uso en la pantalla

En Entendimiento se agregó el botón:

```text
Diagnosticar motores
```

Al presionarlo se muestra un panel con tarjetas para cada motor.

## Variables de entorno compatibles

```text
AUTOVIDEOJEFF_PYTHON
AUTOVIDEOJEFF_WHISPER_CPP
AUTOVIDEOJEFF_WHISPER_CPP_MODEL
AUTOVIDEOJEFF_VOSK_MODEL
```

## Qué resuelve

```text
- El usuario sabe qué falta instalar.
- La app no falla en silencio.
- Se puede revisar por qué no salió una transcripción real.
- Se separa claramente cada motor.
```

## Qué NO hace todavía

```text
- No descarga modelos automáticamente.
- No instala Python.
- No instala paquetes pip.
- No corrige rutas por sí solo.
```

## Siguiente bloque

Bloque 19.10: descarga/instalación guiada de modelos gratuitos.

Debe preparar una pantalla o guía interna para modelos gratuitos sin depender de Gemini ni APIs pagadas.

## Criterio de aceptación

El verificador debe devolver:

```text
Bloque 19.9 OK: diagnóstico de motores instalado y visible en Entendimiento.
```
