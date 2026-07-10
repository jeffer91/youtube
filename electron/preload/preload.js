/* =========================================================
Nombre completo: preload.js
Ruta o ubicación: /electron/preload/preload.js
Funciones principales:
- Crear un puente seguro entre Electron y la interfaz.
- Permitir cargar, verificar y guardar proyectos y videos.
- Permitir inspeccionar, convertir y cancelar videos cuadrados.
- Entregar progreso real de FFmpeg a la pantalla Formato IA.
- Mantener disponibles Audio, Transcripción, Subtítulos, Google Sheets y sincronización.
========================================================= */

const { contextBridge, ipcRenderer } = require("electron");

let listenerProgresoFormato = null;

contextBridge.exposeInMainWorld("videoEditorAPI", {
  seleccionarVideos: async () => ipcRenderer.invoke("dialog:seleccionar-videos"),
  verificarArchivo: async (rutaArchivo) => ipcRenderer.invoke("archivo:existe", rutaArchivo),
  obtenerRutaProyectos: async () => ipcRenderer.invoke("app:ruta-proyectos"),
  abrirCarpetaProyectos: async () => ipcRenderer.invoke("app:abrir-carpeta-proyectos"),
  guardarProyecto: async (proyecto) => ipcRenderer.invoke("proyecto:guardar-json", proyecto),
  guardarProyectoLocal: async (proyecto) => ipcRenderer.invoke("proyecto-local:guardar", proyecto),
  leerProyectoLocal: async (rutaArchivoProyecto) => ipcRenderer.invoke("proyecto-local:leer", rutaArchivoProyecto),
  listarProyectosLocales: async () => ipcRenderer.invoke("proyecto-local:listar"),

  inspeccionarVideoFormato: async (video) => ipcRenderer.invoke("formato:inspeccionar-video", video),
  convertirVideoCuadrado: async (datosFormato) => ipcRenderer.invoke("formato:convertir-cuadrado", datosFormato),
  cancelarConversionFormato: async (processId) => ipcRenderer.invoke("formato:cancelar-conversion", processId),
  escucharProgresoFormato: (callback) => {
    if (listenerProgresoFormato) {
      ipcRenderer.removeListener("formato:progreso", listenerProgresoFormato);
      listenerProgresoFormato = null;
    }
    if (typeof callback !== "function") return false;
    listenerProgresoFormato = (_evento, datos) => callback(datos);
    ipcRenderer.on("formato:progreso", listenerProgresoFormato);
    return true;
  },
  dejarEscucharProgresoFormato: () => {
    if (listenerProgresoFormato) {
      ipcRenderer.removeListener("formato:progreso", listenerProgresoFormato);
      listenerProgresoFormato = null;
    }
    return true;
  },

  mejorarAudio: async (datosMejora) => ipcRenderer.invoke("audio:mejorar-video", datosMejora),
  descargarVideoMejorado: async (datosDescarga) => ipcRenderer.invoke("audio:descargar-video-mejorado", datosDescarga),
  verificarWhisperTranscripcion: async () => ipcRenderer.invoke("transcripcion:verificar-whisper"),
  transcribirVideo: async (datosTranscripcion) => ipcRenderer.invoke("transcripcion:transcribir-video", datosTranscripcion),
  generarVideoSubtitulos: async (datosSubtitulos) => ipcRenderer.invoke("subtitulos:generar-video", datosSubtitulos),
  descargarVideoSubtitulado: async (datosDescarga) => ipcRenderer.invoke("subtitulos:descargar-video", datosDescarga),
  abrirCarpetaSubtitulos: async (rutaCarpeta) => ipcRenderer.invoke("subtitulos:abrir-carpeta", rutaCarpeta),

  obtenerConfigGoogleSheets: async () => ipcRenderer.invoke("google-sheets:obtener-configuracion"),
  guardarConfigGoogleSheets: async (config) => ipcRenderer.invoke("google-sheets:guardar-configuracion", config),
  probarConexionGoogleSheets: async () => ipcRenderer.invoke("google-sheets:probar-conexion"),
  enviarOperacionGoogleSheets: async (operacion) => ipcRenderer.invoke("google-sheets:enviar-operacion", operacion),
  listarPendientesSync: async () => ipcRenderer.invoke("sync:pendientes-listar"),
  obtenerResumenPendientesSync: async () => ipcRenderer.invoke("sync:pendientes-resumen"),
  guardarPendienteSync: async (pendiente) => ipcRenderer.invoke("sync:pendientes-guardar", pendiente),
  reintentarPendientesSync: async () => ipcRenderer.invoke("sync:pendientes-reintentar"),

  plataforma: process.platform
});
