/*
  Bloque 9
  Funcion: preparar el resultado visible por plataforma sin duplicar render de forma insegura.
*/

import { obtenerPlataformaExportacion } from './plataformas.config.js';

function normalizarUrl(ruta = '') {
  if (!ruta) return '';
  return String(ruta).startsWith('/') ? ruta : `/${ruta}`;
}

function obtenerSalidaBase(salida = {}) {
  return {
    plataforma: salida.plataforma || salida.opciones?.plataforma || 'tiktok',
    formato: salida.formato || salida.edicion?.salida?.formato || '9:16',
    urlPublica: normalizarUrl(salida.urlPublica || salida.exportUrl || ''),
    nombreExportado: salida.nombreExportado || '',
    pesoBytes: salida.pesoBytes || null,
    modo: salida.modo || salida.opciones?.modo || ''
  };
}

export function crearResultadoPlataformas({ salida = {}, exportaciones = [], plataformas = [] } = {}) {
  const base = obtenerSalidaBase(salida);
  const ids = plataformas.length
    ? plataformas
    : exportaciones.length
      ? exportaciones.map((item) => item.plataforma)
      : [base.plataforma];

  const unicos = [...new Set(ids.filter(Boolean))];
  const resultados = unicos.map((plataformaId) => {
    const plataforma = obtenerPlataformaExportacion(plataformaId) || { id: plataformaId, nombre: plataformaId, formato: base.formato };
    const esBase = plataforma.id === base.plataforma;
    const plan = exportaciones.find((item) => item.plataforma === plataforma.id) || {};

    return {
      id: plataforma.id,
      plataforma: plataforma.id,
      nombre: plataforma.nombre || plataforma.id,
      formato: plataforma.formato || plan.formato || base.formato,
      width: plataforma.width || plan.width || null,
      height: plataforma.height || plan.height || null,
      estado: esBase && base.urlPublica ? 'exportado' : 'pendiente_render',
      urlPublica: esBase ? base.urlPublica : '',
      nombreExportado: esBase ? base.nombreExportado : plan.videoDestino || '',
      pesoBytes: esBase ? base.pesoBytes : null,
      mensaje: esBase
        ? 'Exportacion final generada.'
        : 'Plataforma preparada. Requiere render final especifico para formato y zona segura.',
      requiereRenderFinal: !esBase,
      destinoPlaneado: plan.videoDestino || ''
    };
  });

  return {
    ok: true,
    total: resultados.length,
    exportadas: resultados.filter((item) => item.estado === 'exportado').length,
    pendientes: resultados.filter((item) => item.estado !== 'exportado').length,
    base,
    resultados,
    creadoEn: new Date().toISOString()
  };
}
