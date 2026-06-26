# AutoVideoJeff

App modular para editar videos automaticamente desde una interfaz sencilla.

La idea principal es que Jeff pueda cargar un video, procesarlo con un clic y obtener una version final lista para redes sociales, especialmente TikTok.

## Estado actual

Estado del proyecto: **en desarrollo avanzado**.

La app ya tiene:

- Modo escritorio con Electron.
- Servidor local con Express.
- Pantalla para cargar videos.
- Diagnostico automatico antes de procesar.
- Barra de progreso real.
- Flujo principal conectado por etapas.
- Modulos de entrada, entendimiento, audio, transcripcion, edicion dinamica, edicion y salida.
- Exportacion final con FFmpeg.
- Modulos opcionales blindados para continuar si fallan.
- Comparacion antes/despues al terminar la exportacion.

Todavia falta cerrar:

- Pruebas finales con videos reales.
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
npm run check:bloque2
npm run check:bloque3
npm run check:todo
```

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
├── salida/              Exportacion final y antes/despues
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
salida/antes-despues/antes-despues.conexion.js
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
  ↓
antes/despues
```

## Reglas del proyecto

1. Ningun archivo debe pasar de 1000 lineas.
2. Si un archivo crece demasiado, se divide por funcionalidad.
3. Cada carpeta debe representar una funcionalidad clara.
4. Cada funcionalidad debe tener su archivo de conexion.
5. Si una funcionalidad falla, no debe romper innecesariamente toda la app.
6. La exportacion final debe conservar el video original y el video editado.
7. Al exportar debe mostrarse una comparacion antes/despues.

## Plan de cierre en 4 bloques

### Bloque 1: Base ordenada

Estado: completado.

### Bloque 2: Modulos blindados

Estado: completado para audio, transcripcion, edicion dinamica y visual dinamico.

### Bloque 3: Exportacion profesional

Estado: completado.

Incluye:

- Video original visible como Antes.
- Video final visible como Despues.
- Reporte `antes-despues.json`.
- Resumen de cambios aplicados.

### Bloque 4: Entrega final

Pendiente:

- Preparar instalador.
- Preparar proceso de actualizacion.
- Preparar pruebas finales.
- Dejar la app lista para uso diario.

## Documentacion de avance

```txt
docs/bloque-1-estado.md
docs/bloque-2-estado.md
docs/bloque-3-estado.md
```

## Version

Version actual declarada en `package.json`: **0.3.5**.
