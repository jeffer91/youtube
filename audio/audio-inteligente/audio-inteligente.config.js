/*
  Nombre completo: audio-inteligente.config.js
  Ruta o ubicación: AutoVideoJeff/audio/audio-inteligente/audio-inteligente.config.js
  Función o funciones:
    - Definir la configuración central del motor Audio Inteligente Pro.
    - Mantener umbrales de análisis, parámetros de salida y límites de seguridad.
    - Permitir sobreescritura controlada de opciones sin romper valores base.
    - Evitar valores extremos que dañen la voz o saturen el audio final.
  Con qué se conecta:
    - audio/audio-inteligente/analizar-audio.service.js
    - audio/audio-inteligente/clasificar-audio.service.js
    - audio/audio-inteligente/construir-cadena-audio.js
    - audio/audio-inteligente/audio-inteligente.service.js
    - biblioteca/audio-inteligente-pro.json
*/

export const AUDIO_INTELIGENTE_VERSION = '1.0.0';
export const MODO_AUDIO_INTELIGENTE = 'audio-inteligente';

const CALIDADES_PERMITIDAS = Object.freeze(['rapido', 'inteligente', 'maximo']);

export const AUDIO_INTELIGENTE_CONFIG = Object.freeze({
  nombre: 'Audio Inteligente Pro',
  modo: MODO_AUDIO_INTELIGENTE,
  version: AUDIO_INTELIGENTE_VERSION,
  activoPorDefecto: true,

  salida: Object.freeze({
    extensionAudio: '.m4a',
    codecAudio: 'aac',
    audioBitrate: '192k',
    frecuenciaMuestreo: 48000,
    canales: 2,
    formatoTemporalAnalisis: 'wav'
  }),

  carpetas: Object.freeze({
    audiosMejorados: 'audios-mejorados',
    reportesAudio: 'reportes-audio',
    temporalesAudio: 'temporales/audio-inteligente'
  }),

  analisis: Object.freeze({
    timeoutMs: 120000,
    silencioNoiseDb: -35,
    silencioDuracionMinimaSeg: 0.35,
    volumenMedioBajoDb: -27,
    volumenMedioMuyBajoDb: -34,
    volumenMedioAltoDb: -12,
    volumenMaximoSeguroDb: -1.2,
    volumenMaximoSaturadoDb: -0.4,
    rangoDinamicoIrregularDb: 24,
    porcentajeSilencioAlto: 32,
    porcentajeSilencioExcesivo: 45,
    duracionMinimaValidaSeg: 0.8
  }),

  filtrosSeguros: Object.freeze({
    highpassMinHz: 55,
    highpassMaxHz: 140,
    lowpassMinHz: 8500,
    lowpassMaxHz: 18000,
    gananciaMinDb: -8,
    gananciaMaxDb: 8,
    reduccionRuidoMin: 4,
    reduccionRuidoMax: 24,
    noiseFloorMinDb: -60,
    noiseFloorMaxDb: -20,
    loudnessMinI: -18,
    loudnessMaxI: -14,
    truePeakMaxDb: -1.0,
    lraMin: 7,
    lraMax: 14
  }),

  calidad: Object.freeze({
    predeterminada: 'inteligente',
    rapido: Object.freeze({
      etiqueta: 'Rápido',
      descripcion: 'Procesa con filtros moderados y bajo tiempo de exportación.',
      intensidadGlobal: 0.75,
      validarDespues: true
    }),
    inteligente: Object.freeze({
      etiqueta: 'Inteligente',
      descripcion: 'Equilibra limpieza, claridad de voz y naturalidad.',
      intensidadGlobal: 1,
      validarDespues: true
    }),
    maximo: Object.freeze({
      etiqueta: 'Máximo',
      descripcion: 'Aplica tratamiento más completo para voz hablada.',
      intensidadGlobal: 1.18,
      validarDespues: true
    })
  }),

  fallback: Object.freeze({
    permitirLimpiezaSimple: true,
    perfilSeguro: 'seguro',
    motivo: 'Se usa un perfil seguro cuando el análisis no es concluyente.'
  }),

  reporte: Object.freeze({
    guardar: true,
    incluirCadenaFfmpeg: true,
    incluirAnalisisInicial: true,
    incluirClasificacion: true,
    incluirValidacionFinal: true
  })
});

function esObjetoPlano(valor) {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
}

function mezclarObjetos(base, extra) {
  if (!esObjetoPlano(extra)) {
    return { ...base };
  }

  const resultado = { ...base };

  for (const [clave, valor] of Object.entries(extra)) {
    if (esObjetoPlano(valor) && esObjetoPlano(base[clave])) {
      resultado[clave] = mezclarObjetos(base[clave], valor);
    } else if (valor !== undefined) {
      resultado[clave] = valor;
    }
  }

  return resultado;
}

export function resolverCalidadAudio(calidadSolicitada) {
  if (!calidadSolicitada || typeof calidadSolicitada !== 'string') {
    return AUDIO_INTELIGENTE_CONFIG.calidad.predeterminada;
  }

  const calidad = calidadSolicitada.trim().toLowerCase();
  return CALIDADES_PERMITIDAS.includes(calidad)
    ? calidad
    : AUDIO_INTELIGENTE_CONFIG.calidad.predeterminada;
}

export function obtenerConfigAudioInteligente(opciones = {}) {
  const config = mezclarObjetos(AUDIO_INTELIGENTE_CONFIG, opciones?.config || opciones);
  const calidad = resolverCalidadAudio(opciones?.calidad || config.calidad?.predeterminada);

  return {
    ...config,
    calidadSeleccionada: calidad,
    calidadActiva: config.calidad?.[calidad] || AUDIO_INTELIGENTE_CONFIG.calidad.inteligente
  };
}

export function limitarNumero(valor, minimo, maximo, respaldo) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return respaldo;
  }

  return Math.min(Math.max(numero, minimo), maximo);
}

export function normalizarBooleano(valor, respaldo = false) {
  if (typeof valor === 'boolean') {
    return valor;
  }

  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'activo'].includes(limpio)) return true;
    if (['false', '0', 'no', 'inactivo'].includes(limpio)) return false;
  }

  return respaldo;
}

export function crearResumenConfigAudio(config = AUDIO_INTELIGENTE_CONFIG) {
  return {
    nombre: config.nombre,
    modo: config.modo,
    version: config.version,
    calidadPredeterminada: config.calidad?.predeterminada,
    salida: config.salida,
    analisis: {
      volumenMedioBajoDb: config.analisis?.volumenMedioBajoDb,
      volumenMaximoSeguroDb: config.analisis?.volumenMaximoSeguroDb,
      silencioNoiseDb: config.analisis?.silencioNoiseDb
    }
  };
}

export default AUDIO_INTELIGENTE_CONFIG;
