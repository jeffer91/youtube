export const TRANSCRIPCION_VERSION = '1.0.0';

export const MODOS_TRANSCRIPCION = Object.freeze({
  DESACTIVADO: 'desactivado',
  MANUAL: 'manual',
  WHISPER_LOCAL: 'whisper-local',
  API: 'api'
});

export const ESTILOS_SUBTITULOS = Object.freeze({
  TIKTOK: 'tiktok-profesional',
  ELEGANTE: 'elegante',
  MINIMALISTA: 'minimalista',
  ALTO_CONTRASTE: 'alto-contraste'
});

export const ESTILOS_TEXTOS_FLOTANTES = Object.freeze({
  BADGE: 'badge',
  IMPACTO: 'impacto',
  ELEGANTE: 'elegante',
  ALERTA: 'alerta'
});

export const TRANSCRIPCION_CONFIG = Object.freeze({
  nombre: 'Transcripción y textos inteligentes',
  version: TRANSCRIPCION_VERSION,
  activoPorDefecto: true,
  transcripcion: Object.freeze({
    crearTranscripcion: true,
    modoTranscripcion: MODOS_TRANSCRIPCION.MANUAL,
    idioma: 'es',
    usarAudioMejoradoSiExiste: true,
    permitirTranscripcionVacia: true,
    textoManualPorDefecto: '',
    maxCaracteresTextoCompleto: 18000,
    maxCaracteresSegmento: 180,
    duracionSegmentoPorDefecto: 3,
    separacionMinimaSegmentos: 0.05
  }),
  subtitulos: Object.freeze({
    agregarSubtitulos: true,
    generarSrt: true,
    generarAss: true,
    estilo: ESTILOS_SUBTITULOS.TIKTOK,
    maxCaracteresLinea: 32,
    maxLineasPorSubtitulo: 2,
    margenInferior: 165,
    fuente: 'Arial',
    tamanoFuente: 58,
    colorPrimario: '&H00FFFFFF',
    colorBorde: '&H00000000',
    colorSombra: '&H80000000',
    grosorBorde: 4,
    sombra: 2,
    alineacion: 2
  }),
  gemini: Object.freeze({
    usarGemini: false,
    modelo: 'gemini-1.5-flash',
    credencial: '',
    guiaUsuario: '',
    temperatura: 0.35,
    maxOutputTokens: 1200,
    timeoutMs: 60000,
    cantidadMaximaTextos: 6,
    permitirFallbackLocal: true,
    devolverSoloJson: true
  }),
  textosFlotantes: Object.freeze({
    agregarTextosFlotantes: true,
    cantidadMaxima: 6,
    duracionMinima: 1.2,
    duracionMaxima: 4,
    maxCaracteresTexto: 42,
    estiloPredeterminado: ESTILOS_TEXTOS_FLOTANTES.BADGE,
    posicionPredeterminada: 'arriba',
    evitarSolapamiento: true
  }),
  archivos: Object.freeze({
    transcripcionJson: 'transcripcion.json',
    transcripcionTxt: 'transcripcion.txt',
    subtitulosSrt: 'subtitulos.srt',
    subtitulosAss: 'subtitulos.ass',
    geminiPaquete: 'gemini-paquete.json',
    geminiRespuesta: 'gemini-respuesta.json',
    geminiRespuestaValidada: 'gemini-respuesta-validada.json',
    textosFlotantes: 'textos-flotantes.json',
    capasVideo: 'capas-video.json',
    reporteTranscripcion: 'reporte-transcripcion.json',
    reporteGemini: 'reporte-gemini.json'
  })
});

function esObjetoPlano(valor) {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
}

export function mezclarObjetos(base, extra) {
  if (!esObjetoPlano(extra)) return { ...base };
  const resultado = { ...base };
  for (const [clave, valor] of Object.entries(extra)) {
    if (esObjetoPlano(valor) && esObjetoPlano(base[clave])) resultado[clave] = mezclarObjetos(base[clave], valor);
    else if (valor !== undefined) resultado[clave] = valor;
  }
  return resultado;
}

export function convertirBooleano(valor, respaldo = false) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }
  return respaldo;
}

export function limitarNumero(valor, minimo, maximo, respaldo) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return respaldo;
  return Math.min(Math.max(numero, minimo), maximo);
}

export function normalizarTexto(valor, respaldo = '') {
  if (typeof valor !== 'string') return respaldo;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : respaldo;
}

export function normalizarModoTranscripcion(valor) {
  const modo = normalizarTexto(valor, TRANSCRIPCION_CONFIG.transcripcion.modoTranscripcion).toLowerCase();
  const permitidos = Object.values(MODOS_TRANSCRIPCION);
  return permitidos.includes(modo) ? modo : TRANSCRIPCION_CONFIG.transcripcion.modoTranscripcion;
}

export function normalizarEstiloSubtitulos(valor) {
  const estilo = normalizarTexto(valor, TRANSCRIPCION_CONFIG.subtitulos.estilo).toLowerCase();
  const permitidos = Object.values(ESTILOS_SUBTITULOS);
  return permitidos.includes(estilo) ? estilo : TRANSCRIPCION_CONFIG.subtitulos.estilo;
}

export function normalizarEstiloTextoFlotante(valor) {
  const estilo = normalizarTexto(valor, TRANSCRIPCION_CONFIG.textosFlotantes.estiloPredeterminado).toLowerCase();
  const permitidos = Object.values(ESTILOS_TEXTOS_FLOTANTES);
  return permitidos.includes(estilo) ? estilo : TRANSCRIPCION_CONFIG.textosFlotantes.estiloPredeterminado;
}

export function obtenerConfigTranscripcion(opciones = {}) {
  const configBase = mezclarObjetos(TRANSCRIPCION_CONFIG, opciones?.configTranscripcion || {});
  return {
    ...configBase,
    transcripcion: {
      ...configBase.transcripcion,
      crearTranscripcion: convertirBooleano(opciones.crearTranscripcion, configBase.transcripcion.crearTranscripcion),
      modoTranscripcion: normalizarModoTranscripcion(opciones.modoTranscripcion || configBase.transcripcion.modoTranscripcion),
      idioma: normalizarTexto(opciones.idiomaTranscripcion || opciones.idioma || configBase.transcripcion.idioma, 'es')
    },
    subtitulos: {
      ...configBase.subtitulos,
      agregarSubtitulos: convertirBooleano(opciones.agregarSubtitulos, configBase.subtitulos.agregarSubtitulos),
      estilo: normalizarEstiloSubtitulos(opciones.estiloSubtitulos || configBase.subtitulos.estilo)
    },
    gemini: {
      ...configBase.gemini,
      usarGemini: convertirBooleano(opciones.usarGemini, configBase.gemini.usarGemini),
      modelo: normalizarTexto(opciones.geminiModelo || configBase.gemini.modelo, configBase.gemini.modelo),
      credencial: normalizarTexto(opciones.geminiCredencial || opciones.geminiApiKey || configBase.gemini.credencial, ''),
      guiaUsuario: normalizarTexto(opciones.geminiGuia || configBase.gemini.guiaUsuario, ''),
      cantidadMaximaTextos: limitarNumero(opciones.maxTextosFlotantes || configBase.gemini.cantidadMaximaTextos, 1, 12, configBase.gemini.cantidadMaximaTextos)
    },
    textosFlotantes: {
      ...configBase.textosFlotantes,
      agregarTextosFlotantes: convertirBooleano(opciones.agregarTextosFlotantes, configBase.textosFlotantes.agregarTextosFlotantes),
      cantidadMaxima: limitarNumero(opciones.maxTextosFlotantes || configBase.textosFlotantes.cantidadMaxima, 1, 12, configBase.textosFlotantes.cantidadMaxima),
      estiloPredeterminado: normalizarEstiloTextoFlotante(opciones.estiloTextosFlotantes || configBase.textosFlotantes.estiloPredeterminado)
    }
  };
}

export function crearResumenConfigTranscripcion(config = TRANSCRIPCION_CONFIG) {
  return {
    nombre: config.nombre,
    version: config.version,
    transcripcion: { activa: config.transcripcion.crearTranscripcion, modo: config.transcripcion.modoTranscripcion, idioma: config.transcripcion.idioma },
    subtitulos: { activos: config.subtitulos.agregarSubtitulos, estilo: config.subtitulos.estilo },
    gemini: { activo: config.gemini.usarGemini, modelo: config.gemini.modelo, cantidadMaximaTextos: config.gemini.cantidadMaximaTextos },
    textosFlotantes: { activos: config.textosFlotantes.agregarTextosFlotantes, cantidadMaxima: config.textosFlotantes.cantidadMaxima }
  };
}

export default TRANSCRIPCION_CONFIG;
