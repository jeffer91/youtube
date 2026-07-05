/* =========================================================
Nombre completo: preload.js
Ruta o ubicación: /electron/preload/preload.js
Funciones principales:
- Crear un puente seguro entre Electron y la pantalla.
- Permitir cargar videos sin exponer Node.js al navegador.
- Permitir verificar archivos.
- Permitir guardar el proyecto base.
- Permitir consultar la carpeta de proyectos.
- Permitir mejorar audio desde la pantalla 02-mejorar-audio.
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

  mejorarAudio: async (datosMejora) => {
    return ipcRenderer.invoke("audio:mejorar-video", datosMejora);
  },

  descargarVideoMejorado: async (datosDescarga) => {
    return ipcRenderer.invoke("audio:descargar-video-mejorado", datosDescarga);
  },

  plataforma: process.platform
});