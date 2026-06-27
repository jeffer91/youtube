import { obtenerConfigTranscripcion } from './transcripcion.config.js';
import { transcribirVideo } from './servicios/transcribir-video.service.js';
import { guardarArchivosTranscripcion } from './servicios/guardar-archivos-transcripcion.js';
import { generarSubtitulos } from './servicios/generar-subtitulos.service.js';
import { prepararPaqueteGemini } from './servicios/preparar-paquete-gemini.js';
import { consultarGeminiParaMomentos } from './gemini/gemini-cliente.service.js';
import { generarMomentosFallbackLocal } from './gemini/gemini-fallback-local.js';
import { guardarArchivosGemini } from './servicios/guardar-archivos-gemini.js';
import { generarTitulosYGanchos } from './servicios/generar-titulos-ganchos.service.js';
import { generarTextosFlotantes } from './textos-flotantes/generar-textos-flotantes.service.js';
import { construirCapasVideo } from './capas/construir-capas-video.js';
import { crearReporteTranscripcion } from './reportes/crear-reporte-transcripcion.js';
import { crearReporteGemini } from './reportes/crear-reporte-gemini.js';
import { crearDiagnosticoTranscripcion } from './diagnostico/diagnostico-transcripcion.service.js';

function validarBase({ entrada, entendimiento }) {
  if (!entrada || typeof entrada !== 'object') throw new Error('No se puede procesar transcripción porque falta la entrada.');
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede procesar transcripción porque falta la carpeta del proyecto.');
  if (!entendimiento || typeof entendimiento !== 'object') throw new Error('No se puede procesar transcripción porque falta el entendimiento del video.');
  if (entendimiento.ok !== true) throw new Error('No se puede procesar transcripción porque el análisis del video no terminó correctamente.');
}

function resultadoOmitido(mensaje, error = null) {
  return {
    ok: true,
    etapa: 'transcripcion',
    omitido: true,
    mensaje,
    transcripcion: null,
    archivosTranscripcion: null,
    subtitulos: null,
    gemini: null,
    fallback: null,
    titulosGanchos: null,
    textosFlotantes: null,
    capasVideo: null,
    reportes: null,
    diagnostico: { ok: true, bloqueante: false, mensaje },
    errorControlado: error ? { modulo: 'transcripcion', mensaje: error.message || String(error), archivo: 'transcripcion/transcripcion.conexion.js' } : null,
    creadoEn: new Date().toISOString()
  };
}

function debeUsarFallback({ geminiResultado, config }) {
  if (!config.gemini.permitirFallbackLocal) return false;
  if (!geminiResultado) return true;
  if (!geminiResultado.ok) return true;
  if (geminiResultado.omitido) return true;
  return (geminiResultado.momentosImportantes || []).length === 0;
}

function combinarMomentosParaTextos(origenMomentos, titulosGanchos) {
  if (!titulosGanchos?.ok || titulosGanchos.omitido) return origenMomentos;
  return {
    ...(origenMomentos || {}),
    ok: true,
    omitido: false,
    origen: `${titulosGanchos.origen || 'titulos'}+${origenMomentos?.origen || 'momentos'}`,
    momentosImportantes: titulosGanchos.momentosImportantes || []
  };
}

export async function procesarTranscripcion({ entrada, entendimiento, audio = null, opciones = {} } = {}) {
  try {
    validarBase({ entrada, entendimiento });
    const config = obtenerConfigTranscripcion(opciones);

    if (!config.transcripcion.crearTranscripcion) return resultadoOmitido('La transcripción está desactivada por opciones.');

    const transcripcion = await transcribirVideo({ entrada, entendimiento, audio, opciones });
    const archivosTranscripcion = await guardarArchivosTranscripcion({ entrada, transcripcion, opciones });
    const subtitulos = await generarSubtitulos({ entrada, transcripcion, opciones });
    const paqueteGemini = prepararPaqueteGemini({ entrada, entendimiento, audio, transcripcion, subtitulos, opciones });
    const geminiResultado = await consultarGeminiParaMomentos({ paqueteGemini, segmentos: transcripcion.segmentos || [], opciones });
    let fallbackResultado = null;
    let origenMomentos = geminiResultado;

    if (debeUsarFallback({ geminiResultado, config })) {
      fallbackResultado = generarMomentosFallbackLocal({ transcripcion, opciones, motivo: geminiResultado?.mensaje || geminiResultado?.error || 'Gemini no generó momentos válidos.' });
      if (fallbackResultado.ok) origenMomentos = fallbackResultado;
    }

    const titulosGanchos = await generarTitulosYGanchos({ entrada, entendimiento, transcripcion, origenMomentos, opciones });
    const origenTextos = combinarMomentosParaTextos(origenMomentos, titulosGanchos);
    const archivosGemini = await guardarArchivosGemini({ entrada, paqueteGemini, geminiResultado, fallbackResultado, opciones });
    const textosFlotantes = await generarTextosFlotantes({ entrada, origenMomentos: origenTextos, opciones });
    const capasVideo = await construirCapasVideo({ entrada, subtitulos, textosFlotantes, opciones });
    const reporteGemini = await crearReporteGemini({ entrada, paqueteGemini, geminiResultado, fallbackResultado, opciones });
    const reporteTranscripcion = await crearReporteTranscripcion({ entrada, transcripcion, archivosTranscripcion, subtitulos, titulosGanchos, textosFlotantes, capasVideo, opciones });
    const diagnostico = await crearDiagnosticoTranscripcion({ entrada, opciones, transcripcion, subtitulos, geminiResultado, fallbackResultado, textosFlotantes, capasVideo });

    return { ok: true, etapa: 'transcripcion', omitido: false, mensaje: 'Módulo de transcripción, títulos, subtítulos y textos procesado correctamente.', transcripcion, archivosTranscripcion, subtitulos, gemini: { ...geminiResultado, archivos: archivosGemini }, fallback: fallbackResultado, titulosGanchos, textosFlotantes, capasVideo, reportes: { gemini: reporteGemini, transcripcion: reporteTranscripcion }, diagnostico, errorControlado: null, creadoEn: new Date().toISOString() };
  } catch (error) {
    console.warn('[transcripcion] Transcripción omitida por error controlado:', error.message);
    return resultadoOmitido('No se pudo preparar transcripción, subtítulos o textos. La edición continuará sin textos automáticos.', error);
  }
}

export default procesarTranscripcion;
