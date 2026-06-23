import path from 'path';
import { escribirJson } from '../../comun/archivos.js';
import { verificarOpcionesTranscripcion } from './verificar-opciones-transcripcion.js';
import { verificarFiltrosFfmpeg } from './verificar-filtros-ffmpeg.js';

function validarCarpetaProyecto(entrada) {
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede crear diagnóstico porque falta la carpeta del proyecto.');
  return entrada.rutas.carpetaProyecto;
}

export async function crearDiagnosticoTranscripcion({ entrada, opciones = {}, transcripcion = null, subtitulos = null, geminiResultado = null, fallbackResultado = null, textosFlotantes = null, capasVideo = null } = {}) {
  const carpetaProyecto = validarCarpetaProyecto(entrada);
  const rutaDiagnostico = path.join(carpetaProyecto, 'diagnostico-transcripcion.json');
  const diagnostico = { ok: true, tipo: 'diagnostico-transcripcion', proyectoId: entrada?.proyecto?.id || null, opciones: verificarOpcionesTranscripcion(opciones), filtros: verificarFiltrosFfmpeg(capasVideo), estado: { transcripcion: { ok: Boolean(transcripcion?.ok), omitido: Boolean(transcripcion?.omitido), segmentos: transcripcion?.cantidadSegmentos || 0 }, subtitulos: { ok: Boolean(subtitulos?.ok), omitido: Boolean(subtitulos?.omitido), segmentosUsados: subtitulos?.segmentosUsados || 0 }, gemini: { ok: Boolean(geminiResultado?.ok), omitido: Boolean(geminiResultado?.omitido), momentos: geminiResultado?.momentosImportantes?.length || 0, error: geminiResultado?.error || null }, fallback: { ok: Boolean(fallbackResultado?.ok), momentos: fallbackResultado?.momentosImportantes?.length || 0 }, textosFlotantes: { ok: Boolean(textosFlotantes?.ok), omitido: Boolean(textosFlotantes?.omitido), cantidad: textosFlotantes?.cantidad || 0 }, capasVideo: { ok: Boolean(capasVideo?.ok), omitido: Boolean(capasVideo?.omitido), usarSubtitulos: Boolean(capasVideo?.usarSubtitulos), usarTextosFlotantes: Boolean(capasVideo?.usarTextosFlotantes) } }, creadoEn: new Date().toISOString() };
  diagnostico.ok = diagnostico.opciones.ok && diagnostico.filtros.ok;
  await escribirJson(rutaDiagnostico, diagnostico);
  return { ok: true, rutaDiagnostico, nombreArchivo: path.basename(rutaDiagnostico), diagnostico };
}

export default crearDiagnosticoTranscripcion;
