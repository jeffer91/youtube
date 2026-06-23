import path from 'path';
import { escribirJson } from '../../comun/archivos.js';
import { obtenerConfigTranscripcion } from '../transcripcion.config.js';

function validarCarpetaProyecto(entrada) {
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede crear reporte de transcripción porque falta la carpeta del proyecto.');
  return entrada.rutas.carpetaProyecto;
}

export async function crearReporteTranscripcion({ entrada, transcripcion, archivosTranscripcion, subtitulos, textosFlotantes, capasVideo, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const carpetaProyecto = validarCarpetaProyecto(entrada);
  const rutaReporte = path.join(carpetaProyecto, config.archivos.reporteTranscripcion);
  const reporte = { ok: true, tipo: 'reporte-transcripcion', proyectoId: entrada?.proyecto?.id || null, transcripcion: { ok: Boolean(transcripcion?.ok), omitido: Boolean(transcripcion?.omitido), fuente: transcripcion?.fuente || null, cantidadSegmentos: transcripcion?.cantidadSegmentos || 0, mensaje: transcripcion?.mensaje || null }, archivosTranscripcion: archivosTranscripcion || null, subtitulos: { ok: Boolean(subtitulos?.ok), omitido: Boolean(subtitulos?.omitido), estilo: subtitulos?.estilo || null, segmentosUsados: subtitulos?.segmentosUsados || 0 }, textosFlotantes: { ok: Boolean(textosFlotantes?.ok), omitido: Boolean(textosFlotantes?.omitido), cantidad: textosFlotantes?.cantidad || 0 }, capasVideo: { ok: Boolean(capasVideo?.ok), omitido: Boolean(capasVideo?.omitido), usarSubtitulos: Boolean(capasVideo?.usarSubtitulos), usarTextosFlotantes: Boolean(capasVideo?.usarTextosFlotantes) }, creadoEn: new Date().toISOString() };
  await escribirJson(rutaReporte, reporte);
  return { ok: true, rutaReporte, nombreArchivo: path.basename(rutaReporte), reporte };
}

export default crearReporteTranscripcion;
