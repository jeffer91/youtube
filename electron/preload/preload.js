/* =========================================================
Nombre completo: preload.js
Ruta o ubicación: /electron/preload/preload.js
Funciones principales:
- Crear un puente seguro entre Electron y la pantalla.
- Permitir cargar videos sin exponer Node.js al navegador.
- Permitir verificar archivos.
- Permitir guardar el proyecto base.
- Permitir consultar la carpeta de proyectos.
- Permitir usar respaldo local JSON de proyectos.
- Permitir mejorar audio desde la pantalla 02-mejorar-audio.
- Permitir transcribir video desde la pantalla 03-transcribir-video.
- Permitir generar, descargar y abrir videos subtitulados desde la pantalla 04.
- Permitir conectar Google Sheets como base principal.
- Permitir consultar y reintentar PendientesSync.
- Permitir descargar/copiar el video mejorado.
========================================================= */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("videoEditorAPI", {
  seleccionarVideos: async () => {
    return ipcRenderer.invoke("dialog:seleccionar-videos");
  },

  verificarArchivo: async (rutaArchivo) => {
    return ipcRenderer.invoke("archivo:existe", rutaArchivo);
  },

  obtenerRutaProyectos: async () => {
    return ipcRenderer.invoke("app:ruta-proyectos");
  },

  abrirCarpetaProyectos: async () => {
    return ipcRenderer.invoke("app:abrir-carpeta-proyectos");
  },

  guardarProyecto: async (proyecto) => {
    return ipcRenderer.invoke("proyecto:guardar-json", proyecto);
  },

  guardarProyectoLocal: async (proyecto) => {
    return ipcRenderer.invoke("proyecto-local:guardar", proyecto);
  },

  leerProyectoLocal: async (rutaArchivoProyecto) => {
    return ipcRenderer.invoke("proyecto-local:leer", rutaArchivoProyecto);
  },

  listarProyectosLocales: async () => {
    return ipcRenderer.invoke("proyecto-local:listar");
  },

  mejorarAudio: async (datosMejora) => {
    return ipcRenderer.invoke("audio:mejorar-video", datosMejora);
  },

  descargarVideoMejorado: async (datosDescarga) => {
    return ipcRenderer.invoke("audio:descargar-video-mejorado", datosDescarga);
  },

  verificarWhisperTranscripcion: async () => {
    return ipcRenderer.invoke("transcripcion:verificar-whisper");
  },

  transcribirVideo: async (datosTranscripcion) => {
    return ipcRenderer.invoke("transcripcion:transcribir-video", datosTranscripcion);
  },

  generarVideoSubtitulos: async (datosSubtitulos) => {
    return ipcRenderer.invoke("subtitulos:generar-video", datosSubtitulos);
  },

  descargarVideoSubtitulado: async (datosDescarga) => {
    return ipcRenderer.invoke("subtitulos:descargar-video", datosDescarga);
  },

  abrirCarpetaSubtitulos: async (rutaCarpeta) => {
    return ipcRenderer.invoke("subtitulos:abrir-carpeta", rutaCarpeta);
  },

  obtenerConfigGoogleSheets: async () => {
    return ipcRenderer.invoke("google-sheets:obtener-configuracion");
  },

  guardarConfigGoogleSheets: async (config) => {
    return ipcRenderer.invoke("google-sheets:guardar-configuracion", config);
  },

  probarConexionGoogleSheets: async () => {
    return ipcRenderer.invoke("google-sheets:probar-conexion");
  },

  enviarOperacionGoogleSheets: async (operacion) => {
    return ipcRenderer.invoke("google-sheets:enviar-operacion", operacion);
  },

  listarPendientesSync: async () => {
    return ipcRenderer.invoke("sync:pendientes-listar");
  },

  obtenerResumenPendientesSync: async () => {
    return ipcRenderer.invoke("sync:pendientes-resumen");
  },

  guardarPendienteSync: async (pendiente) => {
    return ipcRenderer.invoke("sync:pendientes-guardar", pendiente);
  },

  reintentarPendientesSync: async () => {
    return ipcRenderer.invoke("sync:pendientes-reintentar");
  },

  plataforma: process.platform
});
