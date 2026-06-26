# AutoVideoJeff

App modular para editar videos automaticamente desde una interfaz sencilla.

La idea principal es que Jeff pueda cargar un video, procesarlo con un clic y obtener una version final lista para redes sociales, especialmente TikTok.

## Estado actual

Estado del proyecto: **en desarrollo avanzado**.

La app ya tiene una base funcional:

- Modo escritorio con Electron.
- Servidor local con Express.
- Pantalla para cargar videos.
- Diagnostico automatico antes de procesar.
- Barra de progreso real.
- Flujo principal conectado por etapas.
- Modulos de entrada, entendimiento, audio, transcripcion, edicion dinamica, edicion y salida.
- Exportacion final con FFmpeg.

Todavia falta cerrar:

- Pruebas finales con videos reales.
- Mejorar la exportacion con vista antes/despues.
- Preparar instalador de Windows.
- Preparar proceso para APK Android.
- Ajustar documentacion final para usuario no programador.

## Como se usa

### 1. Instalar dependencias

```bash
npm install
```

### 2. Abrir como app de escritorio

```bash
npm start
```

### 3. Abrir como servidor web local

```bash
npm run web
```

Luego abrir:

```txt
http://localhost:3000
```

## Comandos utiles

```bash
npm run check:bloque1
```

Revisa el estado base del Bloque 1.

```bash
npm run check:todo
```

Revisa diagnostico, integracion final y progreso real.

```bash
npm run check:diagnostico
```

Revisa FFmpeg, carpetas y modulos criticos.

```bash
npm run check:integracion-final
```

Revisa que las conexiones principales existan.

```bash
npm run check:progreso
```

Revisa que el progreso real este conectado.

## Estructura principal

```txt
AutoVideoJeff/
├── app/                 Interfaz visual
├── audio/               Mejora y preparacion de audio
├── biblioteca/          Recursos reutilizables
├── comun/               Herramientas compartidas necesarias
├── diagnostico/         Revision automatica de salud del sistema
├── editar/              Plan de edicion y efectos visuales
├── entrada/             Recepcion y copia de videos
├── entender/            Analisis tecnico del video
├── motor/               Flujo principal
├── progreso/            Barra y eventos de progreso
├── salida/              Exportacion final
├── scripts/             Verificaciones manuales
└── transcripcion/       Subtitulos, textos flotantes y Gemini opcional
```

## Regla de arquitectura

Cada carpeta representa una funcionalidad.

Cada funcionalidad debe tener una conexion principal, por ejemplo:

```txt
audio/audio.conexion.js
entrada/entrada.conexion.js
entender/entender.conexion.js
editar/editar.conexion.js
salida/salida.conexion.js
transcripcion/transcripcion.conexion.js
```

El motor principal no debe depender de archivos internos pequeños. Debe hablar con cada modulo a traves de sus archivos de conexion.

## Flujo de trabajo

```txt
entrada
  ↓
entender
  ↓
audio
  ↓
transcripcion
  ↓
edicion dinamica
  ↓
editar
  ↓
salida
```

## Reglas del proyecto

1. Ningun archivo debe pasar de 1000 lineas.
2. Si un archivo crece demasiado, se divide por funcionalidad.
3. Cada carpeta debe representar una funcionalidad clara.
4. Cada funcionalidad debe tener su archivo de conexion.
5. Si una funcionalidad falla, no debe romper innecesariamente toda la app.
6. La exportacion final debe conservar el video original y el video editado.
7. En la siguiente etapa se agregara una vista clara de antes y despues.

## Plan de cierre en 4 bloques

### Bloque 1: Base ordenada

- Actualizar documentacion.
- Revisar conexiones principales.
- Fortalecer diagnostico automatico.
- Dejar claro que existe y que falta.

### Bloque 2: Modulos blindados

- Hacer que entrada, audio, transcripcion, edicion y salida fallen de forma controlada.
- Evitar que un modulo opcional detenga todo si existe alternativa.
- Mejorar mensajes de error.

### Bloque 3: Exportacion profesional

- Guardar video original.
- Guardar video final.
- Crear reporte de cambios.
- Crear comparacion antes/despues.

### Bloque 4: Entrega final

- Preparar instalador.
- Preparar proceso de actualizacion.
- Preparar pruebas finales.
- Dejar la app lista para uso diario.

## Documentacion de avance

El resumen corto del Bloque 1 queda en:

```txt
docs/bloque-1-estado.md
```

## Version

Version actual declarada en `package.json`: **0.3.3**.
