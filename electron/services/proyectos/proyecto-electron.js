/* =========================================================
Nombre completo: proyecto-electron.js
Ruta o ubicación: /electron/services/proyectos/proyecto-electron.js
Funciones principales:
- Registrar IPC de proyectos locales en Electron.
- Guardar JSON local como respaldo temporal.
- Consultar y abrir la carpeta local de proyectos.
- Mantener main.js libre de lógica de archivos de proyecto.
Con qué se conecta:
- proyecto-local.repository.js
- electron/main/main.js
- electron/preload/preload.js
========================================================= */

const {
  obtenerRutaProyectosLocal,
  guardarProyectoLocalJSON,
  leerProyectoLocalJSON,
  listarProyectosLocales
} = require("./proyecto-local.repository.js");

function registrarProyectoLocalElectron({ ipcMain, obtenerRutaData, asegurarCarpeta, shell }) {
  if (!ipcMain || !obtenerRutaData || !asegurarCarpeta) {
    throw new Error("Faltan dependencias para registrar proyectos locales.");
  }

  ipcMain.handle("app:ruta-proyectos", async () => {
    try {
      return {
        ok: true,
        ruta: obtenerRutaProyectosLocal({ obtenerRutaData, asegurarCarpeta })
      };
    } catch (error) {
      return {
        ok: false,
        ruta: "",
        mensaje: "No se pudo obtener la carpeta de proyectos.",
        detalle: error.message
      };
    }
  });

  ipcMain.handle("app:abrir-carpeta-proyectos", async () => {
    try {
      const ruta = obtenerRutaProyectosLocal({ obtenerRutaData, asegurarCarpeta });

      if (shell?.openPath) {
        await shell.openPath(ruta);
      }

      return {
        ok: true,
        ruta
      };
    } catch (error) {
      return {
        ok: false,
        mensaje: "No se pudo abrir la carpeta de proyectos.",
        detalle: error.message
      };
    }
  });

  ipcMain.handle("proyecto:guardar-json", async (_evento, proyecto) => {
    try {
      return guardarProyectoLocalJSON({
        obtenerRutaData,
        asegurarCarpeta,
        proyecto
      });
    } catch (error) {
      return {
        ok: false,
        mensaje: "No se pudo guardar el respaldo local del proyecto.",
        detalle: error.message
      };
    }
  });

  ipcMain.handle("proyecto-local:guardar", async (_evento, proyecto) => {
    try {
      return guardarProyectoLocalJSON({
        obtenerRutaData,
        asegurarCarpeta,
        proyecto
      });
    } catch (error) {
      return {
        ok: false,
        mensaje: "No se pudo guardar el proyecto local.",
        detalle: error.message
      };
    }
  });

  ipcMain.handle("proyecto-local:leer", async (_evento, rutaArchivoProyecto) => {
    return leerProyectoLocalJSON({ rutaArchivoProyecto });
  });

  ipcMain.handle("proyecto-local:listar", async () => {
    try {
      return listarProyectosLocales({
        obtenerRutaData,
        asegurarCarpeta
      });
    } catch (error) {
      return {
        ok: false,
        proyectos: [],
        total: 0,
        mensaje: "No se pudieron listar los proyectos locales.",
        detalle: error.message
      };
    }
  });
}

module.exports = {
  registrarProyectoLocalElectron
};
