import path from 'path';
import { escribirJson } from '../comun/archivos.js';
import { obtenerConfigTranscripcion } from './transcripcion.config.js';
import { transcribirVideo } from './servicios/transcribir-video.service.js';
import { guardarArchivosTranscripcion } from './servicios/guardar-archivos-transcripcion.js';
import { generarSubtitulos } from './servicios/generar-subtitulos.service.js';
import { prepararPaqueteGemini } from './servicios/preparar-paquete-gemini.js';
import { consultarGeminiParaMomentos } from './gemini/gemini-cliente.service.js';
import { generarMomentosFallbackLocal } from './gemini/gemini-fallback-local.js';
import { generarTextosFlotantes } from './textos-flotantes/generar-textos-flotantes.service.js';
import { construirCapasVideo } from './capas/construir-capas-video.js';
import { crearReporteTranscripcion } from './reportes/crear-reporte-transcripcion.js';
import { crearReporteGemini } from './reportes/crear-reporte-gemini.js';

function validarBase({ entrada, entendimiento }) {
  if (!entrada || typeof entrada !== 'object') throw new Error('No se puede procesar transcripción porque falta la entrada.');
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede procesar transcripción porque falta la carpeta del proyecto.');
  if (!entendimiento || typeof entendimiento !== 'object') throw new Error('No se puede procesar transcripción porque falta el entendimiento del video.');
  if (entendimiento.ok !== true) throw new Error('No se puede procesar transcripción porque el análisis del video no terminó correctamente.');
}

function resultadoOmitido(mensaje) {
  return { ok: true, etapa: 'transcripcion', omitido: true, mensaje, transcripcion: null, archivosTranscripcion: null, subtitulos: null, gemini: null, fallback: null, textosFlotantes: null, capasVideo: null, reportes: null, creadoEn: new Date().toISOString() };
}

async function guardarPaqueteGemini({ entrada, paqueteGemini, config }) {
  if (!paqueteGemini?.ok) return null;
  const rutaPaquete = path.join(entrada.rutas.carpetaProyecto, config.archivos.geminiPaquete);
  await escribirJson(rutaPaquete, paqueteGemini);
  return { ruta: rutaPaquete, nombre: path.basename(rutaPaquete) };
}

export async function procesarTranscripcion({ entrada, entendimiento, audio = null, opciones = {} } = {}) {
  validarBase({ entrada, entendimiento });
  const config = obtenerConfigTranscripcion(opciones);
  if (!config.transcripcion.crearTranscripcion) return resultadoOmitido('La transcripción está desactivada por opciones.');
  const transcripcion = await transcribirVideo({ entrada, entendimiento, audio, opciones });
  const archivosTranscripcion = await guardarArchivosTranscripcion({ entrada, transcripcion, opciones });
  const subtitulos = await generarSubtitulos({ entrada, transcripcion, opciones });
  const paqueteGemini = prepararPaqueteGemini({ entrada, entendimiento, audio, transcripcion, subtitulos, opciones });
  const archivoPaqueteGemini = await guardarPaqueteGemini({ entrada, paqueteGemini, config });
  const geminiResultado = await consultarGeminiParaMomentos({ paqueteGemini, segmentos: transcripcion.segmentos || [], opciones });
  let fallbackResultado = null;
  let origenMomentos = geminiResultado;
  if ((!geminiResultado.ok || geminiResultado.omitido || geminiResultado.momentosImportantes.length === 0) && config.gemini.permitirFallbackLocal) {
    fallbackResultado = generarMomentosFallbackLocal({ transcripcion, opciones, motivo: geminiResultado.mensaje || geminiResultado.error || 'Gemini no generó momentos válidos.' });
    if (fallbackResultado.ok) origenMomentos = fallbackResultado;
  }
  const textosFlotantes = await generarTextosFlotantes({ entrada, origenMomentos, opciones });
  const capasVideo = await construirCapasVideo({ entrada, subtitulos, textosFlotantes, opciones });
  const reporteGemini = await crearReporteGemini({ entrada, paqueteGemini, geminiResultado, fallbackResultado, opciones });
  const reporteTranscripcion = await crearReporteTranscripcion({ entrada, transcripcion, archivosTranscripcion, subtitulos, textosFlotantes, capasVideo, opciones });
  return { ok: true, etapa: 'transcripcion', omitido: false, mensaje: 'Módulo de transcripción procesado correctamente.', transcripcion, archivosTranscripcion, subtitulos, gemini: { ...geminiResultado, archivoPaquete: archivoPaqueteGemini }, fallback: fallbackResultado, textosFlotantes, capasVideo, reportes: { gemini: reporteGemini, transcripcion: reporteTranscripcion }, creadoEn: new Date().toISOString() };
}

export default procesarTranscripcion;
