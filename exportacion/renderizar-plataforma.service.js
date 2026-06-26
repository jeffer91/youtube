/*
  Bloque 11
  Funcion: renderizar un archivo final especifico para una plataforma.
*/

import fs from 'fs';
import path from 'path';
import { exportarConFfmpeg } from '../comun/ffmpeg.js';
import { asegurarCarpeta, obtenerRutaRaiz, crearRutaRelativaParaWeb } from '../comun/archivos.js';
import { RENDER_PLATAFORMAS_CONFIG } from './render-plataformas.config.js';
import { crearFiltroContenerFormato, crearNombreExportacionPlataforma } from './filtros-render-plataformas.service.js';

function crearUrlPublica(nombreExportado) {
  return `/exports/${encodeURIComponent(nombreExportado)}`;
}

function obtenerNombreBase(salida = {}) {
  return salida.nombreExportado || path.basename(salida.rutaExportada || 'video-final.mp4');
}

async function validarArchivo(rutaArchivo) {
  const stats = await fs.promises.stat(rutaArchivo);
  if (!stats.isFile() || stats.size <= 0) throw new Error(`Archivo exportado invalido: ${rutaArchivo}`);
  return stats;
}

export async function renderizarPlataforma({ salida = {}, plataforma = {}, opciones = {}, progreso = null } = {}) {
  if (!salida.rutaExportada || !fs.existsSync(salida.rutaExportada)) {
    throw new Error('No existe video base para renderizar plataforma.');
  }

  const raiz = obtenerRutaRaiz();
  const carpetaExportados = path.join(raiz, RENDER_PLATAFORMAS_CONFIG.carpetaExportados);
  asegurarCarpeta(carpetaExportados);

  const nombreExportado = crearNombreExportacionPlataforma({
    nombreBase: obtenerNombreBase(salida),
    plataforma: plataforma.plataforma || plataforma.id,
    formato: plataforma.formato
  });
  const rutaExportada = path.join(carpetaExportados, nombreExportado);
  const filtroVideo = crearFiltroContenerFormato({ formato: plataforma.formato, width: plataforma.width, height: plataforma.height });

  if (typeof progreso === 'function') {
    await progreso({ etapa: 'exportacion-plataformas', porcentaje: 97, titulo: `Render ${plataforma.nombre || plataforma.plataforma}`, detalle: `Generando ${plataforma.formato}.` });
  }

  await exportarConFfmpeg({
    rutaEntrada: salida.rutaExportada,
    rutaSalida: rutaExportada,
    filtroVideo,
    codecVideo: opciones.codecVideo || RENDER_PLATAFORMAS_CONFIG.codecVideo,
    codecAudio: opciones.codecAudio || RENDER_PLATAFORMAS_CONFIG.codecAudio,
    crf: opciones.crf || RENDER_PLATAFORMAS_CONFIG.crf,
    presetFfmpeg: opciones.presetFfmpeg || RENDER_PLATAFORMAS_CONFIG.presetFfmpeg,
    audioBitrate: opciones.audioBitrate || RENDER_PLATAFORMAS_CONFIG.audioBitrate
  });

  const stats = await validarArchivo(rutaExportada);

  return {
    ...plataforma,
    estado: 'exportado',
    requiereRenderFinal: false,
    urlPublica: crearUrlPublica(nombreExportado),
    nombreExportado,
    rutaExportada,
    rutaRelativa: crearRutaRelativaParaWeb(rutaExportada),
    pesoBytes: stats.size,
    mensaje: `Exportacion ${plataforma.formato} generada correctamente.`,
    render: {
      filtroVideo,
      estrategia: RENDER_PLATAFORMAS_CONFIG.estrategiaAjuste,
      codecVideo: opciones.codecVideo || RENDER_PLATAFORMAS_CONFIG.codecVideo,
      codecAudio: opciones.codecAudio || RENDER_PLATAFORMAS_CONFIG.codecAudio
    },
    creadoEn: new Date().toISOString()
  };
}
