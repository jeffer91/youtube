import {
  normalizarOpcionesProcesamiento,
  validarOpcionesProcesamiento
} from './opciones-procesamiento.js';

function esCadenaValida(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function convertirBooleano(valor, valorPorDefecto = true) {
  if (typeof valor === 'boolean') return valor;

  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }

  return valorPorDefecto;
}

function leerJsonSeguro(valor, respaldo = null) {
  if (!valor) return respaldo;
  if (typeof valor === 'object') return valor;
  if (typeof valor !== 'string') return respaldo;

  try {
    return JSON.parse(valor);
  } catch {
    return respaldo;
  }
}

function extraerOpcionesProcesamiento(opciones = {}) {
  const directo = leerJsonSeguro(opciones.opcionesProcesamiento, null)
    || leerJsonSeguro(opciones.procesamientoChecklist, null);

  if (directo?.opciones && typeof directo.opciones === 'object') return directo.opciones;
  if (directo && typeof directo === 'object' && !Array.isArray(directo)) return directo;

  return {
    mejorarAudio: convertirBooleano(opciones.mejorarAudio, true),
    transcripcion: convertirBooleano(opciones.transcripcion ?? opciones.crearTranscripcion, true),
    subtitulos: convertirBooleano(opciones.subtitulos ?? opciones.agregarSubtitulos, true),
    textosFlotantes: convertirBooleano(opciones.textosFlotantes ?? opciones.agregarTextosFlotantes, true),
    cortes: convertirBooleano(opciones.cortes ?? opciones.cortarSilencios ?? opciones.edicionDinamica, true),
    zooms: convertirBooleano(opciones.zooms ?? opciones.agregarZooms ?? opciones.agregarPunchIn, true),
    barraProgreso: convertirBooleano(opciones.barraProgreso ?? opciones.agregarBarraProgreso, true),
    etiquetasVisuales: convertirBooleano(opciones.etiquetasVisuales ?? opciones.agregarEtiquetasVisuales, true),
    sonidos: convertirBooleano(opciones.sonidos ?? opciones.agregarSonidosEdicion, true),
    exportacion: convertirBooleano(opciones.exportacion, true)
  };
}

function esErrorDeFlujoPrincipalFaltante(error) {
  const mensaje = String(error?.message || '');
  return error?.code === 'ERR_MODULE_NOT_FOUND' && mensaje.includes('flujo-principal.js');
}

function validarSolicitud(solicitud) {
  if (!solicitud || typeof solicitud !== 'object') {
    throw new Error('La solicitud del motor no es válida.');
  }

  if (!esCadenaValida(solicitud.archivoTemporal)) {
    throw new Error('No se recibió la ruta temporal del video.');
  }

  if (!esCadenaValida(solicitud.nombreOriginal)) {
    throw new Error('No se recibió el nombre original del video.');
  }

  if (solicitud.opciones && typeof solicitud.opciones !== 'object') {
    throw new Error('Las opciones del motor deben ser un objeto.');
  }
}

function normalizarOpcionesMotor(opciones = {}) {
  const opcionesProcesamiento = normalizarOpcionesProcesamiento(extraerOpcionesProcesamiento(opciones));
  const validacion = validarOpcionesProcesamiento(opcionesProcesamiento);

  if (!validacion.ok) {
    throw new Error(validacion.errores[0] || 'Debes seleccionar al menos una función para procesar.');
  }

  return {
    ...opciones,
    opcionesProcesamiento,
    plataforma: opciones.plataforma || 'tiktok',
    modo: opciones.modo || 'cuadrado-centro',
    mejorarAudio: opcionesProcesamiento.mejorarAudio,
    modoAudio: opciones.modoAudio || 'limpieza-simple',
    crearTranscripcion: opcionesProcesamiento.transcripcion,
    agregarSubtitulos: opcionesProcesamiento.subtitulos,
    agregarTextosFlotantes: opcionesProcesamiento.textosFlotantes,
    edicionDinamica: opcionesProcesamiento.cortes,
    activarEdicionDinamica: opcionesProcesamiento.cortes,
    usarEdicionDinamica: opcionesProcesamiento.cortes,
    cortarSilencios: opcionesProcesamiento.cortes,
    agregarEfectosVisualesDinamicos: Boolean(opcionesProcesamiento.zooms || opcionesProcesamiento.barraProgreso || opcionesProcesamiento.etiquetasVisuales),
    agregarZooms: opcionesProcesamiento.zooms,
    agregarPunchIn: opcionesProcesamiento.zooms,
    agregarBarraProgreso: opcionesProcesamiento.barraProgreso,
    agregarEtiquetasVisuales: opcionesProcesamiento.etiquetasVisuales,
    agregarSonidosEdicion: opcionesProcesamiento.sonidos,
    exportacion: opcionesProcesamiento.exportacion
  };
}

function crearRespuestaFlujoPendiente(solicitud) {
  const opciones = normalizarOpcionesMotor(solicitud.opciones || {});

  return {
    ok: false,
    estado: 'FLUJO_PRINCIPAL_PENDIENTE',
    mensaje: 'Base recibida correctamente, pero falta motor/flujo-principal.js para procesar el video.',
    recibido: {
      nombreOriginal: solicitud.nombreOriginal,
      nombreTemporal: solicitud.nombreTemporal || null,
      plataforma: opciones.plataforma,
      modo: opciones.modo,
      mejorarAudio: opciones.mejorarAudio,
      modoAudio: opciones.modoAudio,
      opcionesProcesamiento: opciones.opcionesProcesamiento
    },
    pendientes: [
      'motor/flujo-principal.js',
      'entrada/entrada.conexion.js',
      'entender/entender.conexion.js',
      'audio/audio.conexion.js',
      'editar/editar.conexion.js',
      'salida/salida.conexion.js'
    ]
  };
}

export async function procesarVideoDesdeMotor(solicitud) {
  validarSolicitud(solicitud);
  const opciones = normalizarOpcionesMotor(solicitud.opciones || {});

  try {
    const moduloFlujo = await import('./flujo-principal.js');

    if (typeof moduloFlujo.ejecutarFlujoPrincipal !== 'function') {
      throw new Error('El flujo principal existe, pero no exporta ejecutarFlujoPrincipal.');
    }

    return await moduloFlujo.ejecutarFlujoPrincipal({
      archivoTemporal: solicitud.archivoTemporal,
      nombreOriginal: solicitud.nombreOriginal,
      nombreTemporal: solicitud.nombreTemporal || null,
      opciones,
      progreso: solicitud.progreso || null,
      jobId: solicitud.jobId || null
    });
  } catch (error) {
    if (esErrorDeFlujoPrincipalFaltante(error)) {
      return crearRespuestaFlujoPendiente({ ...solicitud, opciones });
    }

    throw error;
  }
}

export default {
  procesarVideoDesdeMotor
};
