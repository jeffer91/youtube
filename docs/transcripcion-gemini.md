# Módulo transcripción + Gemini

Este módulo agrega a AutoVideoJeff una fase intermedia entre audio y edición.

## Flujo actual

```txt
entrada → entender → audio → transcripcion → editar → salida
```

## Qué hace

El módulo `transcripcion/` puede:

```txt
1. Recibir transcripción manual.
2. Limpiar y segmentar el texto.
3. Crear archivos transcripcion.json y transcripcion.txt.
4. Crear subtítulos SRT y ASS.
5. Preparar un paquete para Gemini.
6. Enviar el paquete a Gemini si el usuario activó la opción.
7. Usar fallback local si Gemini falla o está desactivado.
8. Crear textos-flotantes.json.
9. Crear capas-video.json.
10. Entregar las capas al módulo editar/.
```

## Archivos principales

```txt
transcripcion/transcripcion.conexion.js
transcripcion/transcripcion.config.js
transcripcion/servicios/transcribir-video.service.js
transcripcion/servicios/generar-subtitulos.service.js
transcripcion/gemini/gemini-cliente.service.js
transcripcion/gemini/gemini-fallback-local.js
transcripcion/textos-flotantes/generar-textos-flotantes.service.js
transcripcion/capas/construir-capas-video.js
```

## Gemini

La credencial de Gemini se ingresa desde el pop-up de la interfaz.

No se guarda en el repositorio.

No se debe escribir una credencial dentro del código.

## Transcripción automática futura

Ya existe el archivo:

```txt
transcripcion/servicios/whisper-local.service.js
```

Ese archivo prepara el camino para usar Whisper local si el usuario lo instala en su computadora.

## Comandos de prueba

```bash
npm run check:transcripcion
npm run test:transcripcion-manual
npm run test:gemini-fallback
npm run test:drawtext
```

Estos comandos no procesan un video real. Solo verifican que los módulos internos estén conectados y generen estructuras correctas.
