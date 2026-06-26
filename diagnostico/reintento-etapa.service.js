/*
  Bloque 19
  Funcion: construir plan de reintento para etapa fallida.
*/

const ETAPAS_REINTENTABLES = Object.freeze({
  entrada: { puedeReintentar: true, archivo: 'entrada/entrada.conexion.js', accion: 'Revisar archivo seleccionado y volver a procesar.' },
  entender: { puedeReintentar: true, archivo: 'entender/entender.conexion.js', accion: 'Reintentar analisis del video.' },
  audio: { puedeReintentar: true, archivo: 'audio/audio.conexion.js', accion: 'Reintentar audio con modo simple si vuelve a fallar.' },
  transcripcion: { puedeReintentar: true, archivo: 'transcripcion/transcripcion.conexion.js', accion: 'Reintentar textos y subtitulos; si falla, usar transcripcion manual.' },
  'edicion-dinamica': { puedeReintentar: true, archivo: 'editar/edicion-dinamica/edicion-dinamica.conexion.js', accion: 'Reintentar sin cortar silencios si vuelve a fallar.' },
  editar: { puedeReintentar: true, archivo: 'editar/editar.conexion.js', accion: 'Reintentar visuales con modo seguro.' },
  salida: { puedeReintentar: true, archivo: 'salida/salida.conexion.js', accion: 'Reintentar exportacion final.' },
  modular: { puedeReintentar: true, archivo: 'motor/flujo-modular-autovideo.service.js', accion: 'Reintentar modulos nuevos con fallback local.' },
  'exportacion-plataformas': { puedeReintentar: true, archivo: 'exportacion/renderizar-plataformas-pendientes.service.js', accion: 'Reintentar render multiplataforma.' },
  diagnostico: { puedeReintentar: false, archivo: 'diagnostico/diagnostico-automatico.service.js', accion: 'Primero corregir diagnostico antes de reintentar.' },
  servidor: { puedeReintentar: true, archivo: 'server.js', accion: 'Reintentar proceso completo despues de revisar el error.' },
  app: { puedeReintentar: true, archivo: 'app/app.js', accion: 'Reintentar desde la interfaz si el video sigue seleccionado.' }
});

export function normalizarEtapaError(valor = '') {
  const texto = String(valor || '').toLowerCase();
  const coincidencia = texto.match(/flujo-principal:([^\]]+)/);
  const etapa = coincidencia ? coincidencia[1] : texto;
  if (ETAPAS_REINTENTABLES[etapa]) return etapa;
  if (texto.includes('diagnostico')) return 'diagnostico';
  if (texto.includes('audio')) return 'audio';
  if (texto.includes('transcrip')) return 'transcripcion';
  if (texto.includes('export') || texto.includes('salida')) return 'salida';
  if (texto.includes('gemini') || texto.includes('modular')) return 'modular';
  return 'servidor';
}

export function crearPlanReintento({ etapa = '', error = null, jobId = '', detalle = '' } = {}) {
  const etapaNormalizada = normalizarEtapaError(etapa || error?.etapa || error?.message || detalle);
  const regla = ETAPAS_REINTENTABLES[etapaNormalizada] || ETAPAS_REINTENTABLES.servidor;
  const mensaje = error?.message || detalle || 'Error no especificado.';

  return {
    ok: true,
    jobId,
    etapa: etapaNormalizada,
    puedeReintentar: regla.puedeReintentar,
    archivo: regla.archivo,
    accion: regla.accion,
    mensaje,
    recomendacion: regla.puedeReintentar
      ? 'Puedes reintentar desde la app mientras el video siga seleccionado.'
      : 'No conviene reintentar hasta resolver el diagnostico bloqueante.',
    creadoEn: new Date().toISOString()
  };
}

export function crearRespuestaReintentoNoDisponible(motivo = 'No hay etapa fallida para reintentar.') {
  return {
    ok: false,
    puedeReintentar: false,
    mensaje: motivo,
    recomendacion: 'Selecciona nuevamente el video y ejecuta el diagnostico fuerte.',
    creadoEn: new Date().toISOString()
  };
}
