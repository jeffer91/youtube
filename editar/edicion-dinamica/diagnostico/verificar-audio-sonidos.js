import fs from 'fs';

export function verificarAudioSonidos(sonidos = null) {
  const errores = [];
  const advertencias = [];

  if (!sonidos) {
    advertencias.push('No existe resultado de sonidos de edición.');
  }

  if (sonidos?.ok !== true) {
    errores.push('La etapa de sonidos no terminó correctamente.');
  }

  if (sonidos && !sonidos.omitido && !sonidos.audioConSonidos) {
    errores.push('Se indicó que los sonidos fueron aplicados, pero falta audioConSonidos.');
  }

  if (sonidos?.audioConSonidos && !fs.existsSync(sonidos.audioConSonidos)) {
    errores.push(`No existe el audio con sonidos: ${sonidos.audioConSonidos}`);
  }

  if ((sonidos?.eventosSonido?.length || 0) > 20) {
    advertencias.push('Hay demasiados eventos de sonido. Puede saturar la voz principal.');
  }

  return {
    ok: errores.length === 0,
    errores,
    advertencias,
    mensaje: errores.length === 0 ? 'Audio con sonidos verificado.' : `Audio con sonidos tiene problemas: ${errores.join(', ')}`
  };
}

export default verificarAudioSonidos;
