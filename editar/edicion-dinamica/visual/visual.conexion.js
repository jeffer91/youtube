import path from 'path';
import { escribirJson, asegurarCarpeta } from '../../../comun/archivos.js';
import { reportarModulo } from '../../../progreso/progreso-modulo.js';
import { generarEventosVisualesDinamicos } from './generar-eventos-visuales.service.js';
import { generarFiltroBarraProgreso } from './generar-barra-progreso.service.js';
import { generarEtiquetasVisuales } from './generar-etiquetas-visuales.service.js';
import { construirFiltroVisualFfmpeg } from './construir-filtro-visual-ffmpeg.js';

function obtenerDuracion(edicionDinamica, entendimiento) {
  return Number(edicionDinamica?.mapaTiempo?.duracionEditada || edicionDinamica?.cortes?.resumen?.duracionEditada || entendimiento?.analisis?.duracionSegundos || 0);
}

function crearOmitido({ filtroBase, mensaje, error = null }) {
  return {
    ok: true,
    omitido: true,
    mensaje,
    filtroVideo: filtroBase || '',
    eventosVisuales: [],
    barraProgreso: null,
    etiquetas: null,
    errorControlado: error
      ? {
          modulo: 'visual-dinamico',
          mensaje: error.message || String(error),
          archivo: 'editar/edicion-dinamica/visual/visual.conexion.js'
        }
      : null,
    creadoEn: new Date().toISOString()
  };
}

export async function procesarVisualDinamico({ filtroBase, edicionDinamica = null, transcripcion = null, entendimiento = null, salida = {}, opciones = {}, progreso = null } = {}) {
  if (!filtroBase) {
    return crearOmitido({ filtroBase: '', mensaje: 'Visual dinámico omitido porque falta filtro base.' });
  }

  try {
    if (!edicionDinamica?.activo || edicionDinamica?.omitido || opciones?.agregarEfectosVisualesDinamicos === false) {
      await reportarModulo(progreso, { etapa: 'editar', porcentaje: 78, titulo: 'Visual dinámico omitido', detalle: 'No se aplicaron efectos visuales dinámicos por configuración o falta de edición dinámica.', archivo: 'editar/edicion-dinamica/visual/visual.conexion.js' });
      return crearOmitido({ filtroBase, mensaje: 'Visual dinámico omitido por configuración.' });
    }

    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 78, titulo: 'Generando eventos visuales', detalle: 'Preparando zooms, etiquetas y barra de progreso.', archivo: 'editar/edicion-dinamica/visual/generar-eventos-visuales.service.js' });

    const duracion = obtenerDuracion(edicionDinamica, entendimiento);
    const eventos = generarEventosVisualesDinamicos({ edicionDinamica, transcripcion, opciones });

    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 80, titulo: 'Eventos visuales listos', detalle: `${eventos.eventos.length} eventos visuales generados.`, datos: { eventosVisuales: eventos.eventos.length, fuentes: eventos.fuentes || [] }, archivo: 'editar/edicion-dinamica/visual/generar-eventos-visuales.service.js' });

    const barraProgreso = generarFiltroBarraProgreso({ duracionSegundos: duracion, opciones });
    const etiquetas = generarEtiquetasVisuales({ eventos: eventos.eventos, opciones });

    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 82, titulo: 'Etiquetas y barra listas', detalle: `${etiquetas?.filtros?.length || 0} etiquetas visuales preparadas.`, datos: { etiquetas: etiquetas?.filtros?.length || 0, barraProgreso: Boolean(barraProgreso) }, archivo: 'editar/edicion-dinamica/visual/generar-etiquetas-visuales.service.js' });

    const filtro = construirFiltroVisualFfmpeg({ filtroBase, barraProgreso, etiquetas, width: salida.width || 1080, height: salida.height || 1920, opciones });

    const resultado = { ok: true, omitido: false, mensaje: 'Visual dinámico aplicado al filtro de render.', filtroVideo: filtro.filtroVideo, eventosVisuales: eventos.eventos, fuentes: eventos.fuentes, barraProgreso, etiquetas, filtrosAplicados: filtro.filtrosAplicados, detalle: filtro.detalle, duracionSegundos: duracion, errorControlado: null, creadoEn: new Date().toISOString() };
    const carpetaVisual = edicionDinamica?.carpetaEdicionDinamica ? path.join(edicionDinamica.carpetaEdicionDinamica, 'visual') : null;

    if (carpetaVisual) {
      asegurarCarpeta(carpetaVisual);
      await escribirJson(path.join(carpetaVisual, 'eventos-visuales.json'), eventos);
      await escribirJson(path.join(carpetaVisual, 'visual-dinamico.json'), resultado);
    }

    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 84, titulo: 'Visual dinámico aplicado', detalle: `${eventos.eventos.length} eventos · ${filtro.filtrosAplicados?.length || 0} filtros agregados.`, datos: { eventosVisuales: eventos.eventos.length, filtrosAplicados: filtro.filtrosAplicados?.length || 0 }, archivo: 'editar/edicion-dinamica/visual/visual.conexion.js' });

    return resultado;
  } catch (error) {
    console.warn('[visual-dinamico] Visual omitido por error controlado:', error.message);
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 84, titulo: 'Visual dinámico omitido', detalle: 'Se mantiene el filtro base para que la exportación continúe.', archivo: 'editar/edicion-dinamica/visual/visual.conexion.js' });
    return crearOmitido({
      filtroBase,
      mensaje: 'No se pudo aplicar visual dinámico. Se mantiene la edición base.',
      error
    });
  }
}

export default procesarVisualDinamico;
