/* =========================================================
Nombre completo: tr-api-electron.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/adaptadores/tr-api-electron.js
Funciones principales:
- Centralizar la comunicación de Transcripción con Electron.
- Evitar que la pantalla acceda directamente a funciones del sistema.
- Devolver errores simples cuando la API todavía no existe.
- Preparar la conexión futura con preload e IPC.
Con qué se conecta:
- tr.js
- electron/preload/preload.js
- tr-electron-registro.js
========================================================= */

function obtenerApiBaseTR() {
  return window.videoEditorAPI || null;
}

function crearRespuestaNoDisponibleTR(nombreFuncion) {
  return {
    ok: false,
    mensaje: `La función ${nombreFuncion} todavía no está conectada en Electron.`
  };
}

export function crearApiElectronTR() {
  const api = obtenerApiBaseTR();

  function verificarDisponibilidad() {
    if (!api) {
      return {
        ok: false,
        mensaje: "La API segura de Electron no está disponible."
      };
    }

    return {
      ok: true,
      mensaje: "API de Electron disponible."
    };
  }

  async function transcribirVideo(payload) {
    if (!api?.transcribirVideo) {
      return crearRespuestaNoDisponibleTR("transcribirVideo");
    }

    return api.transcribirVideo(payload);
  }

  async function cancelarTranscripcion(payload) {
    if (!api?.cancelarTranscripcion) {
      return crearRespuestaNoDisponibleTR("cancelarTranscripcion");
    }

    return api.cancelarTranscripcion(payload);
  }

  async function exportarTranscripcion(payload) {
    if (!api?.exportarTranscripcion) {
      return crearRespuestaNoDisponibleTR("exportarTranscripcion");
    }

    return api.exportarTranscripcion(payload);
  }

  async function abrirCarpetaTranscripciones() {
    if (!api?.abrirCarpetaTranscripciones) {
      return crearRespuestaNoDisponibleTR("abrirCarpetaTranscripciones");
    }

    return api.abrirCarpetaTranscripciones();
  }

  return {
    verificarDisponibilidad,
    transcribirVideo,
    cancelarTranscripcion,
    exportarTranscripcion,
    abrirCarpetaTranscripciones
  };
}