import path from 'path';
import { escribirJson, asegurarCarpeta } from '../../../comun/archivos.js';
import { generarEventosVisualesDinamicos } from './generar-eventos-visuales.service.js';
import { generarFiltroBarraProgreso } from './generar-barra-progreso.service.js';
import { generarEtiquetasVisuales } from './generar-etiquetas-visuales.service.js';
import { construirFiltroVisualFfmpeg } from './construir-filtro-visual-ffmpeg.js';

function obtenerDuracion(edicionDinamica, entendimiento) {
  return Number(edicionDinamica?.mapaTiempo?.duracionEditada || edicionDinamica?.cortes?.resumen?.duracionEditada || entendimiento?.analisis?.duracionSegundos || 0);
}

function crearOmitido({ filtroBase, mensaje }) {
  return {
    ok: true,
    omitido: true,
    mensaje,
    filtroVideo: filtroBase,
    eventosVisuales: [],
    barraProgreso: null,
    etiquetas: null,
    creadoEn: new Date().toISOString()
  };
}

export async function procesarVisualDinamico({ filtroBase, edicionDinamica = null, transcripcion = null, entendimiento = null, salida = {}, opciones = {} } = {}) {
  if (!filtroBase) throw new Error('No se puede procesar visual dinámico sin filtro base.');

  if (!edicionDinamica?.activo || edicionDinamica?.omitido || opciones?.agregarEfectosVisualesDinamicos === false) {
    return crearOmitido({ filtroBase, mensaje: 'Visual dinámico omitido por configuración.' });
  }

  const duracion = obtenerDuracion(edicionDinamica, entendimiento);
  const eventos = generarEventosVisualesDinamicos({ edicionDinamica, transcripcion, opciones });
  const barraProgreso = generarFiltroBarraProgreso({ duracionSegundos: duracion, opciones });
  const etiquetas = generarEtiquetasVisuales({ eventos: eventos.eventos, opciones });
  const filtro = construirFiltroVisualFfmpeg({
    filtroBase,
    barraProgreso,
    etiquetas,
    width: salida.width || 1080,
    height: salida.height || 1920,
    opciones
  });

  const resultado = {
    ok: true,
    omitido: false,
    mensaje: 'Visual dinámico aplicado al filtro de render.',
    filtroVideo: filtro.filtroVideo,
    eventosVisuales: eventos.eventos,
    fuentes: eventos.fuentes,
    barraProgreso,
    etiquetas,
    filtrosAplicados: filtro.filtrosAplicados,
    detalle: filtro.detalle,
    duracionSegundos: duracion,
    creadoEn: new Date().toISOString()
  };

  const carpetaVisual = edicionDinamica?.carpetaEdicionDinamica
    ? path.join(edicionDinamica.carpetaEdicionDinamica, 'visual')
    : null;

  if (carpetaVisual) {
    asegurarCarpeta(carpetaVisual);
    await escribirJson(path.join(carpetaVisual, 'eventos-visuales.json'), eventos);
    await escribirJson(path.join(carpetaVisual, 'visual-dinamico.json'), resultado);
  }

  return resultado;
}

export default procesarVisualDinamico;
