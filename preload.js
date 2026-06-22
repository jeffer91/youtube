/*
  Nombre completo: preload.js
  Ruta o ubicación: AutoVideoJeff/preload.js
  Función:
    - Exponer a la interfaz una API mínima y segura para modo Electron.
    - Mantener contextIsolation activo.
    - Evitar activar nodeIntegration en el frontend.
*/

import { contextBridge, ipcRenderer } from 'electron';

const api = Object.freeze({
  entorno: Object.freeze({
    modo: 'electron',
    plataforma: process.platform
  }),

  servidor: Object.freeze({
    obtenerEstado: async () => {
      return await ipcRenderer.invoke('app:estado');
    }
  })
});

contextBridge.exposeInMainWorld('AutoVideoJeff', api);