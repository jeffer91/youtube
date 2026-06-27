export const MOTORES_TRANSCRIPCION = Object.freeze({
  MANUAL: 'manual',
  FASTER_WHISPER: 'faster-whisper',
  WHISPER_CPP: 'whisper-cpp',
  VOSK: 'vosk',
  GEMINI: 'gemini'
});

export const ESTADOS_TRANSCRIPCION = Object.freeze({
  OK: 'ok',
  VACIA: 'vacia',
  OMITIDA: 'omitida',
  ERROR: 'error',
  PENDIENTE: 'pendiente'
});

export const CARPETAS_TRANSCRIPCION_MULTIMOTOR = Object.freeze({
  RAIZ: 'transcripciones',
  MOTORES: 'motores',
  PRINCIPAL: 'principal'
});

export const ARCHIVOS_TRANSCRIPCION_MULTIMOTOR = Object.freeze({
  TRANSCRIPCION_MOTOR: 'transcripcion.json',
  TRANSCRIPCION_PRINCIPAL: 'transcripcion-principal.json',
  RESUMEN_MOTORES: 'resumen-motores.json'
});

function limpiarTexto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function numeroSeguro(valor, respaldo = null) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : respaldo;
}

function limitar(valor, minimo, maximo, respaldo) {
  const numero = numeroSeguro(valor, respaldo);
  if (numero === null) return respaldo;
  return Math.min(Math.max(numero, minimo), maximo);
}

export function motorTranscripcionValido(motor) {
  return Object.values(MOTORES_TRANSCRIPCION).includes(motor);
}

export function normalizarIdMotorTranscripcion(motor = MOTORES_TRANSCRIPCION.MANUAL) {
  const limpio = limpiarTexto(motor, MOTORES_TRANSCRIPCION.MANUAL).toLowerCase();
  if (motorTranscripcionValido(limpio)) return limpio;
  if (['faster_whisper', 'fasterwhisper'].includes(limpio)) return MOTORES_TRANSCRIPCION.FASTER_WHISPER;
  if (['whisper.cpp', 'whisper_cpp', 'whispercpp'].includes(limpio)) return MOTORES_TRANSCRIPCION.WHISPER_CPP;
  return MOTORES_TRANSCRIPCION.MANUAL;
}

export function crearNombreSeguroMotor(motor) {
  return normalizarIdMotorTranscripcion(motor).replace(/[^a-z0-9-]/g, '-');
}

export function normalizarSegmentoTranscripcion(segmento = {}, indice = 0) {
  const inicio = Math.max(0, numeroSeguro(segmento.inicio ?? segmento.start ?? segmento.desde, 0));
  const finOriginal = numeroSeguro(segmento.fin ?? segmento.end ?? segmento.hasta, null);
  const fin = finOriginal !== null ? Math.max(inicio, finOriginal) : null;
  const texto = limpiarTexto(segmento.texto ?? segmento.text ?? segmento.frase ?? '');
  const confianza = limitar(segmento.confianza ?? segmento.confidence, 0, 1, null);

  return {
    id: limpiarTexto(segmento.id, `seg-${String(indice + 1).padStart(4, '0')}`),
    indice,
    inicio,
    fin,
    duracion: fin !== null ? Number((fin - inicio).toFixed(3)) : null,
    texto,
    confianza,
    palabras: texto ? texto.split(/\s+/).filter(Boolean).length : 0,
    metadata: segmento.metadata && typeof segmento.metadata === 'object' ? segmento.metadata : {}
  };
}

export function normalizarSegmentosTranscripcion(segmentos = []) {
  if (!Array.isArray(segmentos)) return [];
  return segmentos
    .map((segmento, indice) => normalizarSegmentoTranscripcion(segmento, indice))
    .filter((segmento) => segmento.texto || segmento.fin !== null);
}

export function construirTextoDesdeSegmentos(segmentos = []) {
  return normalizarSegmentosTranscripcion(segmentos)
    .map((segmento) => segmento.texto)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function transcripcionTieneTextoUtil(transcripcion = {}) {
  const texto = limpiarTexto(transcripcion.textoCompleto || construirTextoDesdeSegmentos(transcripcion.segmentos || []));
  return texto.length >= 8;
}

export function crearResumenTranscripcion(transcripcion = {}) {
  const segmentos = normalizarSegmentosTranscripcion(transcripcion.segmentos || []);
  const textoCompleto = limpiarTexto(transcripcion.textoCompleto || construirTextoDesdeSegmentos(segmentos));
  const palabras = textoCompleto ? textoCompleto.split(/\s+/).filter(Boolean).length : 0;
  const inicio = segmentos.length ? segmentos[0].inicio : null;
  const fin = segmentos.length ? segmentos[segmentos.length - 1].fin : null;

  return {
    tieneTexto: textoCompleto.length > 0,
    textoUtil: textoCompleto.length >= 8,
    caracteres: textoCompleto.length,
    palabras,
    segmentos: segmentos.length,
    inicio,
    fin,
    duracionCubierta: inicio !== null && fin !== null ? Number((fin - inicio).toFixed(3)) : null
  };
}

export function crearTranscripcionNormalizadaMotor({
  motor = MOTORES_TRANSCRIPCION.MANUAL,
  estado = ESTADOS_TRANSCRIPCION.PENDIENTE,
  idioma = 'es',
  textoCompleto = '',
  segmentos = [],
  duracionSegundos = null,
  confianza = null,
  fuenteAudio = null,
  mensaje = '',
  error = null,
  metadata = {}
} = {}) {
  const motorId = normalizarIdMotorTranscripcion(motor);
  const segmentosNormalizados = normalizarSegmentosTranscripcion(segmentos);
  const textoFinal = limpiarTexto(textoCompleto || construirTextoDesdeSegmentos(segmentosNormalizados));
  const resumen = crearResumenTranscripcion({ textoCompleto: textoFinal, segmentos: segmentosNormalizados });
  const estadoFinal = error
    ? ESTADOS_TRANSCRIPCION.ERROR
    : textoFinal
      ? ESTADOS_TRANSCRIPCION.OK
      : estado;

  return {
    ok: estadoFinal === ESTADOS_TRANSCRIPCION.OK,
    version: '1.0.0-multimotor',
    motor: motorId,
    estado: estadoFinal,
    idioma: limpiarTexto(idioma, 'es'),
    textoCompleto: textoFinal,
    segmentos: segmentosNormalizados,
    cantidadSegmentos: segmentosNormalizados.length,
    duracionSegundos: numeroSeguro(duracionSegundos, null),
    confianza: limitar(confianza, 0, 1, null),
    fuenteAudio,
    resumen,
    mensaje: limpiarTexto(mensaje, estadoFinal === ESTADOS_TRANSCRIPCION.OK ? 'Transcripción normalizada correctamente.' : 'Transcripción sin texto útil.'),
    error: error ? { mensaje: error.message || String(error) } : null,
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
    creadoEn: new Date().toISOString()
  };
}

export function crearResultadoMotorTranscripcion({ motor, transcripcion = null, estado = ESTADOS_TRANSCRIPCION.PENDIENTE, mensaje = '', error = null, metadata = {} } = {}) {
  const motorId = normalizarIdMotorTranscripcion(motor);
  const normalizada = transcripcion
    ? crearTranscripcionNormalizadaMotor({ ...transcripcion, motor: motorId, estado, error, metadata: { ...(transcripcion.metadata || {}), ...metadata } })
    : crearTranscripcionNormalizadaMotor({ motor: motorId, estado, mensaje, error, metadata });

  return {
    ok: normalizada.ok,
    motor: motorId,
    estado: normalizada.estado,
    transcripcion: normalizada,
    resumen: normalizada.resumen,
    mensaje: normalizada.mensaje,
    error: normalizada.error,
    creadoEn: normalizada.creadoEn
  };
}

export function elegirMejorResultadoTranscripcion(resultados = [], ordenMotores = []) {
  const lista = Array.isArray(resultados) ? resultados.filter(Boolean) : [];
  const prioridad = new Map((ordenMotores || []).map((motor, indice) => [normalizarIdMotorTranscripcion(motor), indice]));

  return lista
    .filter((resultado) => resultado?.transcripcion && transcripcionTieneTextoUtil(resultado.transcripcion))
    .sort((a, b) => {
      const resumenA = a.transcripcion.resumen || crearResumenTranscripcion(a.transcripcion);
      const resumenB = b.transcripcion.resumen || crearResumenTranscripcion(b.transcripcion);
      const scoreA = (resumenA.palabras || 0) + (resumenA.segmentos || 0) * 3 - (prioridad.get(a.motor) ?? 99);
      const scoreB = (resumenB.palabras || 0) + (resumenB.segmentos || 0) * 3 - (prioridad.get(b.motor) ?? 99);
      return scoreB - scoreA;
    })[0] || null;
}
