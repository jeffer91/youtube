/*
  Bloque 11
  Funcion: renderizar exportaciones pendientes despues del video base.
*/

import fs from 'fs';
import { renderizarPlataforma } from './renderizar-plataforma.service.js';
import { RENDER_PLATAFORMAS_CONFIG } from './render-plataformas.config.js';

function puedeRenderizar(salida = {}) {
  return Boolean(salida.rutaExportada && fs.existsSync(salida.rutaExportada));
}

function debeRenderizar(item = {}, salida = {}, opciones = {}) {
  if (item.estado === 'exportado' && !opciones.renderizarBaseOtraVez) return false;
  if (item.plataforma === salida.plataforma && !RENDER_PLATAFORMAS_CONFIG.renderizarBaseOtraVez) return false;
  return item.requiereRenderFinal !== false;
}

export async function renderizarPlataformasPendientes({ salida = {}, resultadoPlataformas = {}, opciones = {}, progreso = null } = {}) {
  const resultados = resultadoPlataformas.resultados || [];
  if (!resultados.length) return resultadoPlataformas;

  if (!puedeRenderizar(salida)) {
    return {
      ...resultadoPlataformas,
      renderMultiplataforma: {
        ok: false,
        omitido: true,
        mensaje: 'No se renderizaron plataformas adicionales porque no existe el video base.'
      }
    };
  }

  const renderizados = [];
  const errores = [];

  for (const item of resultados) {
    if (!debeRenderizar(item, salida, opciones)) {
      renderizados.push(item);
      continue;
    }

    try {
      renderizados.push(await renderizarPlataforma({ salida, plataforma: item, opciones, progreso }));
    } catch (error) {
      errores.push({ plataforma: item.plataforma, mensaje: error.message });
      renderizados.push({
        ...item,
        estado: 'error_render',
        requiereRenderFinal: true,
        mensaje: `No se pudo renderizar ${item.nombre || item.plataforma}: ${error.message}`
      });
    }
  }

  return {
    ...resultadoPlataformas,
    resultados: renderizados,
    exportadas: renderizados.filter((item) => item.estado === 'exportado').length,
    pendientes: renderizados.filter((item) => item.estado !== 'exportado').length,
    renderMultiplataforma: {
      ok: errores.length === 0,
      omitido: false,
      total: renderizados.length,
      errores,
      mensaje: errores.length ? 'Algunas plataformas no se pudieron renderizar.' : 'Todas las plataformas pendientes fueron procesadas.'
    },
    actualizadoEn: new Date().toISOString()
  };
}
