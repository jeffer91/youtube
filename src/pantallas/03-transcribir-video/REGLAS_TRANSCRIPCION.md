# Módulo Transcripción

Este módulo será la pantalla 03 de la app de escritorio `video-editor-electron`.

## Formas de uso

- Desde la app Electron ejecutada con `npm start`.
- Desde la app instalada cuando exista instalador.
- Desde el menú principal, entrando a la pantalla `03-transcribir-video`.
- No está pensado para abrirse con doble click directo sobre `tr.html`.

## Alcance

La pantalla permitirá seleccionar un video del proyecto activo, elegir el origen de audio, configurar idioma, seleccionar motor de transcripción, procesar el audio, generar texto, generar segmentos con tiempo, guardar la transcripción y exportar archivos para uso posterior.

El módulo debe preparar resultados reutilizables para:

- Texto completo.
- Segmentos con tiempo.
- Exportación TXT.
- Exportación SRT.
- Exportación VTT.
- Exportación JSON.
- Pantalla futura de subtítulos automáticos.

## Regla técnica

Este módulo sí pertenece a Electron.

No usará Vite, React ni Netlify.

Debe funcionar con HTML, CSS y JavaScript modular, respetando la arquitectura actual de la app.

La pantalla visual no debe procesar archivos pesados directamente.

Toda operación pesada debe pasar por Electron mediante `preload` e IPC.

## Regla de modularidad

Ningún archivo debe crecer demasiado.

Si un archivo se acerca a 700 líneas, debe dividirse por responsabilidad.

Cada archivo debe tener una sola responsabilidad principal.

La pantalla `tr.js` solo debe iniciar la pantalla y conectar eventos principales.

La lógica de transcripción debe vivir en carpetas separadas:

- `estado`: datos temporales de la pantalla.
- `ui`: renderizado visual.
- `casos`: acciones grandes del usuario.
- `dominio`: reglas puras de transcripción.
- `adaptadores`: comunicación con app, proyecto y Electron.
- `exportadores`: generación de TXT, SRT, VTT y JSON.
- `electron`: procesamiento real, rutas, motores y archivos.

## Regla de nombres

Todos los archivos del módulo deben usar el prefijo `tr-`, excepto:

- `tr.html`
- `tr.css`
- `tr.js`
- `REGLAS_TRANSCRIPCION.md`

No se deben crear archivos con nombres genéricos como:

- `main.js`
- `service.js`
- `utils.js`
- `index.js`
- `renderer.js`

## Regla de conexión con el proyecto

El módulo no debe inventar videos.

Debe leer los videos desde el proyecto activo.

Cada transcripción debe quedar asociada al video correspondiente.

El resultado debe poder guardarse dentro del proyecto y también exportarse como archivos externos.

## Regla de motores

El diseño debe permitir varios motores.

Motor principal recomendado:

- Whisper local mediante Electron.

Motor opcional futuro:

- OpenAI API.

El código no debe depender de un solo motor fijo.

Debe existir un selector o adaptador de motor para poder cambiarlo sin romper la pantalla.

## Regla de seguridad

La pantalla no debe acceder directamente a `fs`, `path`, procesos del sistema ni archivos locales usando Node.

Eso debe hacerse únicamente desde la capa Electron.

El navegador solo debe comunicarse mediante funciones expuestas en `window.videoEditorAPI`.

## Regla de errores

Todo error debe mostrarse en lenguaje simple.

No mostrar errores técnicos largos al usuario final.

Debe existir un archivo especializado para normalizar errores de transcripción.

## Regla de futuro

Este módulo debe dejar lista la información para la pantalla 04 de subtítulos automáticos.

La transcripción debe guardar segmentos con:

- tiempo de inicio;
- tiempo de fin;
- texto del segmento.

No basta con guardar solo texto plano.
