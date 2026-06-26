/*
  Modulo: audio
  Funcion: detectar una posible zona de ruido al inicio del video/audio.
  Nota: este servicio crea el plan tecnico; la medicion real con FFmpeg/FFprobe se conecta en el motor.
*/

export const RUIDO_INICIAL_CONFIG = Object.freeze({
  segundosRevision: 4,
  duracionMaximaSilencio: 3,
  umbralRuidoAltoDb: -12,
  umbralRuidoMedioDb: -24,
  accionPorDefecto: 'silenciar_o_limpiar'
});

export function detectarRuidoInicial(datos = {}, opciones = {}) {
  const config = { ...RUIDO_INICIAL_CONFIG, ...(opciones.ruidoInicial || {}) };
  const analisisAudio = datos.analisisAudio || datos.audio || {};
  const picoInicialDb = Number.isFinite(analisisAudio.picoInicialDb) ? analisisAudio.picoInicialDb : null;
  const ruidoReportado = Boolean(datos.ruidoInicial || analisisAudio.ruidoInicial);

  let nivel = 'desconocido';
  if (picoInicialDb !== null && picoInicialDb >= config.umbralRuidoAltoDb) nivel = 'alto';
  else if (picoInicialDb !== null && picoInicialDb >= config.umbralRuidoMedioDb) nivel = 'medio';
  else if (picoInicialDb !== null) nivel = 'bajo';
  else if (ruidoReportado) nivel = 'medio';

  const detectado = ruidoReportado || ['alto', 'medio'].includes(nivel);

  return {
    ok: true,
    detectado,
    nivel,
    picoInicialDb,
    inicio: 0,
    fin: detectado ? Math.min(config.segundosRevision, config.duracionMaximaSilencio) : 0,
    accionSugerida: detectado ? config.accionPorDefecto : 'mantener',
    mensaje: detectado
      ? 'Se detecto una posible zona de ruido inicial para limpiar, silenciar o cortar.'
      : 'No se detecto ruido inicial relevante con la informacion disponible.',
    creadoEn: new Date().toISOString()
  };
}
