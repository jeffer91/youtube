/* =========================================================
Nombre completo: tr-caso-exportar.js
Ruta o ubicación: /src/pantallas/03-transcribir-video/casos/tr-caso-exportar.js
Funciones principales:
- Preparar la exportación de una transcripción.
- Validar que exista resultado antes de exportar.
- Enviar la petición de exportación a Electron.
- Mantener la pantalla separada de la lógica de archivos.
Con qué se conecta:
- tr.js
- tr-api-electron.js
- tr-exportar-txt.js
- tr-exportar-srt.js
- tr-exportar-vtt.js
- tr-exportar-json.js
========================================================= */

export async function ejecutarCasoExportarTR({ estado, apiElectron }) {
  const resultado = estado?.resultado || null;
  const videoId = estado?.videoSeleccionadoId || "";

  if (!resultado) {
    return {
      ok: false,
      mensaje: "Primero genera una transcripción antes de exportar."
    };
  }

  if (!videoId) {
    return {
      ok: false,
      mensaje: "No hay un video seleccionado para exportar."
    };
  }

  if (!apiElectron?.exportarTranscripcion) {
    return {
      ok: false,
      mensaje: "La exportación todavía no está conectada con Electron."
    };
  }

  const respuesta = await apiElectron.exportarTranscripcion({
    proyectoId: estado?.proyectoActivo?.id || "",
    videoId,
    resultado
  });

  if (!respuesta?.ok) {
    return {
      ok: false,
      mensaje: respuesta?.mensaje || "No se pudo exportar la transcripción."
    };
  }

  return {
    ok: true,
    mensaje: respuesta.mensaje || "Transcripción exportada correctamente.",
    archivos: respuesta.archivos || null
  };
}