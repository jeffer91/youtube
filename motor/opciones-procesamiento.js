/*
  Nombre completo: opciones-procesamiento.js
  Ruta: /motor/opciones-procesamiento.js

  Función:
  - Normalizar las opciones que llegan desde el checklist del frontend.
  - Mantener todo activo por defecto si el frontend todavía no manda opciones.
  - Aplicar reglas de dependencia en el backend.
*/

export const VERSION_OPCIONES_PROCESAMIENTO = '1.0.0';

export const OPCIONES_PROCESAMIENTO_DEFECTO = Object.freeze({
  mejorarAudio: true,
  transcripcion: true,
  subtitulos: true,
  textosFlotantes: true,
  cortes: true,
  zooms: true,
  barraProgreso: true,
  etiquetasVisuales: true,
  sonidos: true,
  exportacion: true
});

export const ETIQUETAS_OPCIONES_PROCESAMIENTO = Object.freeze({
  mejorarAudio: 'Mejorar audio',
  transcripcion: 'Transcribir video',
  subtitulos: 'Generar subtítulos',
  textosFlotantes: 'Textos flotantes',
  cortes: 'Cortes automáticos',
  zooms: 'Zooms y punch-in',
  barraProgreso: 'Barra de progreso',
  etiquetasVisuales: 'Etiquetas visuales',
  sonidos: 'Sonidos automáticos',
  exportacion: 'Exportar video final'
});

export const REGLAS_DEPENDENCIAS_MOTOR = Object.freeze([
  { principal: 'transcripcion', dependientes: ['subtitulos', 'textosFlotantes'] },
  { principal: 'cortes', dependientes: ['zooms', 'barraProgreso', 'etiquetasVisuales', 'sonidos'] }
]);

export function obtenerClavesOpcionesProcesamiento() {
  return Object.keys(OPCIONES_PROCESAMIENTO_DEFECTO);
}

export function crearOpcionesProcesamientoPorDefecto() {
  return { ...OPCIONES_PROCESAMIENTO_DEFECTO };
}

export function crearOpcionesProcesamientoVacias() {
  return obtenerClavesOpcionesProcesamiento().reduce((acumulado, clave) => {
    acumulado[clave] = false;
    return acumulado;
  }, {});
}

export function convertirBooleano(valor, respaldo = true) {
  if (valor === true || valor === 'true' || valor === 1 || valor === '1') return true;
  if (valor === false || valor === 'false' || valor === 0 || valor === '0') return false;
  return respaldo;
}

export function parsearOpcionesProcesamiento(entrada = null) {
  if (!entrada) return {};

  if (typeof entrada === 'object' && !Array.isArray(entrada)) {
    if (entrada.opciones && typeof entrada.opciones === 'object') return entrada.opciones;
    return entrada;
  }

  if (typeof entrada !== 'string') return {};

  try {
    const parseado = JSON.parse(entrada);
    if (parseado?.opciones && typeof parseado.opciones === 'object') return parseado.opciones;
    if (parseado && typeof parseado === 'object' && !Array.isArray(parseado)) return parseado;
  } catch {
    return {};
  }

  return {};
}

export function aplicarDependenciasOpcionesProcesamiento(opcionesEntrada = {}) {
  const opciones = { ...opcionesEntrada };

  REGLAS_DEPENDENCIAS_MOTOR.forEach((regla) => {
    if (opciones[regla.principal] !== false) return;
    regla.dependientes.forEach((claveDependiente) => {
      opciones[claveDependiente] = false;
    });
  });

  return opciones;
}

export function normalizarOpcionesProcesamiento(entrada = null) {
  const parseadas = parsearOpcionesProcesamiento(entrada);
  const defecto = crearOpcionesProcesamientoPorDefecto();
  const normalizadas = {};

  obtenerClavesOpcionesProcesamiento().forEach((clave) => {
    normalizadas[clave] = convertirBooleano(parseadas[clave], defecto[clave]);
  });

  return aplicarDependenciasOpcionesProcesamiento(normalizadas);
}

export function contarOpcionesProcesamientoActivas(opcionesEntrada = null) {
  const opciones = normalizarOpcionesProcesamiento(opcionesEntrada);

  return obtenerClavesOpcionesProcesamiento().reduce((total, clave) => {
    return total + (opciones[clave] === true ? 1 : 0);
  }, 0);
}

export function validarOpcionesProcesamiento(entrada = null) {
  const opciones = normalizarOpcionesProcesamiento(entrada);
  const totalActivas = contarOpcionesProcesamientoActivas(opciones);

  if (totalActivas <= 0) {
    return { ok: false, opciones, errores: ['Debes seleccionar al menos una función para procesar.'] };
  }

  return { ok: true, opciones, errores: [] };
}

export function estaOpcionProcesamientoActiva(opcionesEntrada = null, clave) {
  const opciones = normalizarOpcionesProcesamiento(opcionesEntrada);
  return opciones[clave] === true;
}

export function debeProcesarAudio(opcionesEntrada = null) { return estaOpcionProcesamientoActiva(opcionesEntrada, 'mejorarAudio'); }
export function debeProcesarTranscripcion(opcionesEntrada = null) { return estaOpcionProcesamientoActiva(opcionesEntrada, 'transcripcion'); }
export function debeProcesarSubtitulos(opcionesEntrada = null) { return estaOpcionProcesamientoActiva(opcionesEntrada, 'subtitulos'); }
export function debeProcesarTextosFlotantes(opcionesEntrada = null) { return estaOpcionProcesamientoActiva(opcionesEntrada, 'textosFlotantes'); }
export function debeProcesarCortes(opcionesEntrada = null) { return estaOpcionProcesamientoActiva(opcionesEntrada, 'cortes'); }
export function debeProcesarZooms(opcionesEntrada = null) { return estaOpcionProcesamientoActiva(opcionesEntrada, 'zooms'); }
export function debeProcesarBarraProgreso(opcionesEntrada = null) { return estaOpcionProcesamientoActiva(opcionesEntrada, 'barraProgreso'); }
export function debeProcesarEtiquetasVisuales(opcionesEntrada = null) { return estaOpcionProcesamientoActiva(opcionesEntrada, 'etiquetasVisuales'); }
export function debeProcesarSonidos(opcionesEntrada = null) { return estaOpcionProcesamientoActiva(opcionesEntrada, 'sonidos'); }
export function debeExportarVideo(opcionesEntrada = null) { return estaOpcionProcesamientoActiva(opcionesEntrada, 'exportacion'); }

export function obtenerEtiquetaOpcionProcesamiento(clave) {
  return ETIQUETAS_OPCIONES_PROCESAMIENTO[clave] || clave;
}

export default {
  VERSION_OPCIONES_PROCESAMIENTO,
  OPCIONES_PROCESAMIENTO_DEFECTO,
  ETIQUETAS_OPCIONES_PROCESAMIENTO,
  REGLAS_DEPENDENCIAS_MOTOR,
  obtenerClavesOpcionesProcesamiento,
  crearOpcionesProcesamientoPorDefecto,
  crearOpcionesProcesamientoVacias,
  convertirBooleano,
  parsearOpcionesProcesamiento,
  aplicarDependenciasOpcionesProcesamiento,
  normalizarOpcionesProcesamiento,
  contarOpcionesProcesamientoActivas,
  validarOpcionesProcesamiento,
  estaOpcionProcesamientoActiva,
  debeProcesarAudio,
  debeProcesarTranscripcion,
  debeProcesarSubtitulos,
  debeProcesarTextosFlotantes,
  debeProcesarCortes,
  debeProcesarZooms,
  debeProcesarBarraProgreso,
  debeProcesarEtiquetasVisuales,
  debeProcesarSonidos,
  debeExportarVideo,
  obtenerEtiquetaOpcionProcesamiento
};
