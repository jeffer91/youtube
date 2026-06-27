/*
  Nueva etapa estructural - Bloque 1
  Función: consolidar transcripción, fotogramas y análisis del video en un reporte único.
*/

import path from 'path';
import { escribirJson } from '../../comun/archivos.js';

function texto(valor, respaldo = '') {
  const limpio = String(valor || '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function crearEstado(nombre, ok, detalle, accion = null) {
  return { nombre, ok: Boolean(ok), detalle, accionRecomendada: accion };
}

export async function crearReporteEntendimiento({ entrada, analisis, transcripcion, fotogramas, analisisVideo, opciones = {} } = {}) {
  const estados = [
    crearEstado('Análisis técnico', analisis?.ok, `${analisis?.orientacion || 'sin orientación'} · ${analisis?.duracionSegundos || 0}s · audio ${analisis?.tieneAudio ? 'sí' : 'no'}`),
    crearEstado('Transcripción', Boolean(transcripcion?.textoCompleto), transcripcion?.textoCompleto ? 'Transcripción disponible.' : 'Transcripción real pendiente.', 'Bloque 2 debe activar Gemini/transcripción real.'),
    crearEstado('Fotogramas', fotogramas?.ok, `${fotogramas?.cantidadExtraida || 0} fotograma(s) extraído(s).`, fotogramas?.ok ? null : 'Revisar FFmpeg o ruta del video.'),
    crearEstado('Análisis de video', analisisVideo?.ok, analisisVideo?.mensaje || 'Análisis editorial generado.')
  ];

  const listoParaEditar = estados.find((item) => item.nombre === 'Análisis técnico')?.ok && estados.find((item) => item.nombre === 'Análisis de video')?.ok;
  const reporte = {
    ok: true,
    etapa: 'entender-reporte',
    tipo: 'reporte-entendimiento-video',
    proyecto: {
      id: entrada?.proyecto?.id || null,
      perfil: texto(opciones?.perfil || entrada?.proyecto?.perfil, 'general'),
      plataforma: texto(opciones?.plataforma || entrada?.proyecto?.plataforma, 'tiktok')
    },
    listoParaEditar: Boolean(listoParaEditar),
    estados,
    resumen: {
      tecnico: analisis || null,
      transcripcion: {
        tipo: transcripcion?.tipo || null,
        motor: transcripcion?.motor || null,
        textoDisponible: Boolean(transcripcion?.textoCompleto),
        segmentos: Array.isArray(transcripcion?.segmentos) ? transcripcion.segmentos.length : 0
      },
      fotogramas: {
        ok: Boolean(fotogramas?.ok),
        cantidad: fotogramas?.cantidadExtraida || 0,
        carpeta: fotogramas?.carpetaFotogramas || null
      },
      editorial: analisisVideo?.resumenEditorial || null,
      momentosClave: analisisVideo?.momentosClave || [],
      necesidades: analisisVideo?.necesidades || []
    },
    mensaje: listoParaEditar ? 'Entendimiento base completo. La edición puede continuar.' : 'Entendimiento incompleto. La app continuará, pero debe mejorar transcripción/fotogramas.',
    creadoEn: new Date().toISOString()
  };

  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (carpetaProyecto) await escribirJson(path.join(carpetaProyecto, 'entendimiento', 'reporte-entendimiento.json'), reporte);
  return reporte;
}

export default crearReporteEntendimiento;
