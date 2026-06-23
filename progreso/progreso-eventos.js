import { obtenerConfigEtapa } from './progreso.config.js';

const ARCHIVOS_POR_ERROR = Object.freeze({
  diagnostico: 'diagnostico/diagnostico-automatico.service.js',
  entrada: 'entrada/entrada.conexion.js',
  entender: 'entender/entender.conexion.js',
  audio: 'audio/audio.conexion.js',
  transcripcion: 'transcripcion/transcripcion.conexion.js',
  'edicion-dinamica': 'editar/edicion-dinamica/edicion-dinamica.conexion.js',
  cortes: 'editar/edicion-dinamica/cortes/cortes.conexion.js',
  visual: 'editar/edicion-dinamica/visual/visual.conexion.js',
  sonidos: 'editar/edicion-dinamica/sonidos/sonidos.conexion.js',
  editar: 'editar/editar.conexion.js',
  salida: 'salida/exportar-simple/exportar.service.js',
  servidor: 'server.js',
  app: 'app/app.js'
});

function limitarPorcentaje(valor, respaldo = 0) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return respaldo;
  return Math.max(0, Math.min(100, Math.round(numero)));
}

export function crearEventoProgreso({ jobId, etapa = 'inicio', porcentaje = null, titulo = null, detalle = '', estado = 'procesando', datos = {}, archivo = null } = {}) {
  const base = obtenerConfigEtapa(etapa);
  return {
    jobId,
    tipo: 'progreso',
    estado,
    etapa,
    porcentaje: limitarPorcentaje(porcentaje ?? base.porcentaje, base.porcentaje),
    titulo: titulo || base.titulo || etapa,
    detalle: detalle || '',
    datos: datos || {},
    archivo: archivo || base.archivo || null,
    fecha: new Date().toISOString()
  };
}

export function detectarEtapaDesdeError(error) {
  const mensaje = String(error?.message || error || '').toLowerCase();
  if (mensaje.includes('diagnostico') || mensaje.includes('diagnóstico')) return 'diagnostico';
  if (mensaje.includes('entrada') || mensaje.includes('copiar')) return 'entrada';
  if (mensaje.includes('ffprobe') || mensaje.includes('analisis') || mensaje.includes('análisis')) return 'entender';
  if (mensaje.includes('audio') || mensaje.includes('sonido')) return 'audio';
  if (mensaje.includes('transcrip') || mensaje.includes('subt')) return 'transcripcion';
  if (mensaje.includes('silencio') || mensaje.includes('corte')) return 'cortes';
  if (mensaje.includes('visual') || mensaje.includes('drawtext') || mensaje.includes('filtro')) return 'visual';
  if (mensaje.includes('export') || mensaje.includes('salida') || mensaje.includes('ffmpeg')) return 'salida';
  if (mensaje.includes('app') || mensaje.includes('interfaz')) return 'app';
  return 'servidor';
}

export function crearEventoError({ jobId, etapa = null, error, detalle = null, archivo = null, datos = {} } = {}) {
  const etapaDetectada = etapa || detectarEtapaDesdeError(error);
  const mensaje = String(error?.message || error || 'Error desconocido.');
  const base = obtenerConfigEtapa('error');
  const archivoSugerido = archivo || ARCHIVOS_POR_ERROR[etapaDetectada] || base.archivo;

  return {
    jobId,
    tipo: 'fallo',
    estado: 'error',
    etapa: etapaDetectada,
    porcentaje: 100,
    titulo: `Fallo en ${etapaDetectada}`,
    detalle: detalle || mensaje,
    error: {
      mensaje,
      stack: error?.stack || null
    },
    archivo: archivoSugerido,
    recomendacion: `Revisar ${archivoSugerido}`,
    datos: datos || {},
    fecha: new Date().toISOString()
  };
}

export function crearEventoFinalizado({ jobId, detalle = 'Video listo.', datos = {} } = {}) {
  return {
    ...crearEventoProgreso({ jobId, etapa: 'finalizado', porcentaje: 100, titulo: 'Video listo', detalle, estado: 'finalizado', datos }),
    tipo: 'finalizado'
  };
}

export default { crearEventoProgreso, crearEventoError, crearEventoFinalizado, detectarEtapaDesdeError };
