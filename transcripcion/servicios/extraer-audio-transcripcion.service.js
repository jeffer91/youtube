import fs from 'fs';

function existeArchivo(ruta) {
  return Boolean(ruta && typeof ruta === 'string' && fs.existsSync(ruta));
}

export function resolverFuenteAudioTranscripcion({ entrada, audio = null, opciones = {} } = {}) {
  const usarAudioMejorado = opciones.usarAudioMejoradoSiExiste !== false;
  if (usarAudioMejorado && audio?.usarAudioMejorado && existeArchivo(audio?.rutaAudioMejorado)) {
    return { ok: true, tipo: 'audio-mejorado', ruta: audio.rutaAudioMejorado, mensaje: 'Se usará el audio mejorado para la transcripción.' };
  }
  if (existeArchivo(entrada?.video?.rutaOriginal)) {
    return { ok: true, tipo: 'video-original', ruta: entrada.video.rutaOriginal, mensaje: 'Se usará el video original como fuente de transcripción.' };
  }
  return { ok: false, tipo: 'sin-fuente', ruta: null, mensaje: 'No existe una fuente válida para transcribir.' };
}

export default resolverFuenteAudioTranscripcion;
