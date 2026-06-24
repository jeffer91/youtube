import { obtenerConfigTranscripcion } from './transcripcion.config.js';
import { transcribirVideo } from './servicios/transcribir-video.service.js';
import { guardarArchivosTranscripcion } from './servicios/guardar-archivos-transcripcion.js';
import { generarSubtitulos } from './servicios/generar-subtitulos.service.js';
import { prepararPaqueteGemini } from './servicios/preparar-paquete-gemini.js';
import { consultarGeminiParaMomentos } from './gemini/gemini-cliente.service.js';
import { generarMomentosFallbackLocal } from './gemini/gemini-fallback-local.js';
import { guardarArchivosGemini } from './servicios/guardar-archivos-gemini.js';
import { generarTextosFlotantes } from './textos-flotantes/generar-textos-flotantes.service.js';
import { construirCapasVideo } from './capas/construir-capas-video.js';
import { crearReporteTranscripcion } from './reportes/crear-reporte-transcripcion.js';
import { crearReporteGemini } from './reportes/crear-reporte-gemini.js';
import { crearDiagnosticoTranscripcion } from './diagnostico/diagnostico-transcripcion.service.js';
import { calcularImpactoTexto } from '../motor/metricas/texto-impacto.service.js';

function validarBase({ entrada, entendimiento }) {
  if (!entrada || typeof entrada !== 'object') throw new Error('No se puede procesar transcripción porque falta la entrada.');
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede procesar transcripción porque falta la carpeta del proyecto.');
  if (!entendimiento || typeof entendimiento !== 'object') throw new Error('No se puede procesar transcripción porque falta el entendimiento del video.');
  if (entendimiento.ok !== true) throw new Error('No se puede procesar transcripción porque el análisis del video no terminó correctamente.');
}

function resultadoOmitido(mensaje, entendimiento, opciones) {
  const resultado = {
    ok: true,
    etapa: 'transcripcion',
    omitido: true,
    mensaje,
    transcripcion: null,
    archivosTranscripcion: null,
    subtitulos: { ok: true, omitido: true, mensaje: 'Subtítulos omitidos porque no se procesó transcripción.' },
    gemini: { ok: true, omitido: true, mensaje: 'Gemini omitido porque no se procesó transcripción.' },
    fallback: null,
    textosFlotantes: { ok: true, omitido: true, mensaje: 'Textos flotantes omitidos porque no se procesó transcripción.', textos: [], cantidad: 0 },
    capasVideo: { ok: true, omitido: true, mensaje: 'No hay capas de transcripción para aplicar.', usarSubtitulos: false, usarTextosFlotantes: false, filtroCapasFinal: '' },
    reportes: null,
    diagnostico: null,
    creadoEn: new Date().toISOString()
  };
  return { ...resultado, impactoTexto: calcularImpactoTexto({ transcripcion: resultado, entendimiento, opciones }) };
}

function resultadoModuloOmitido(mensaje, extras = {}) {
  return { ok: true, omitido: true, mensaje, creadoEn: new Date().toISOString(), ...extras };
}

function debeUsarFallback({ geminiResultado, config }) {
  if (!config.gemini.permitirFallbackLocal) return false;
  if (!geminiResultado) return true;
  if (!geminiResultado.ok) return true;
  if (geminiResultado.omitido) return true;
  return (geminiResultado.momentosImportantes || []).length === 0;
}

export async function procesarTranscripcion({ entrada, entendimiento, audio = null, opciones = {} } = {}) {
  validarBase({ entrada, entendimiento });
  const config = obtenerConfigTranscripcion(opciones);

  if (!config.transcripcion.crearTranscripcion) {
    return resultadoOmitido('La transcripción está desactivada por selección del usuario.', entendimiento, opciones);
  }

  const transcripcion = await transcribirVideo({ entrada, entendimiento, audio, opciones });
  const archivosTranscripcion = await guardarArchivosTranscripcion({ entrada, transcripcion, opciones });
  const subtitulos = config.subtitulos.agregarSubtitulos
    ? await generarSubtitulos({ entrada, transcripcion, opciones })
    : resultadoModuloOmitido('Subtítulos omitidos por selección del usuario.', { srt: null, ass: null, segmentosUsados: 0 });
  const necesitaTextosFlotantes = config.textosFlotantes.agregarTextosFlotantes === true;

  let paqueteGemini = null;
  let geminiResultado = null;
  let fallbackResultado = null;
  let origenMomentos = null;
  let archivosGemini = null;
  let reporteGemini = null;

  if (necesitaTextosFlotantes) {
    paqueteGemini = prepararPaqueteGemini({ entrada, entendimiento, audio, transcripcion, subtitulos, opciones });
    geminiResultado = await consultarGeminiParaMomentos({ paqueteGemini, segmentos: transcripcion.segmentos || [], opciones });
    origenMomentos = geminiResultado;
    if (debeUsarFallback({ geminiResultado, config })) {
      fallbackResultado = generarMomentosFallbackLocal({ transcripcion, opciones, motivo: geminiResultado?.mensaje || geminiResultado?.error || 'Gemini no generó momentos válidos.' });
      if (fallbackResultado.ok) origenMomentos = fallbackResultado;
    }
    archivosGemini = await guardarArchivosGemini({ entrada, paqueteGemini, geminiResultado, fallbackResultado, opciones });
    reporteGemini = await crearReporteGemini({ entrada, paqueteGemini, geminiResultado, fallbackResultado, opciones });
  } else {
    geminiResultado = resultadoModuloOmitido('Gemini omitido porque Textos flotantes está desmarcado.', { momentosImportantes: [] });
    origenMomentos = geminiResultado;
    archivosGemini = resultadoModuloOmitido('No se guardaron archivos Gemini porque Textos flotantes está desmarcado.', { archivos: [] });
    reporteGemini = resultadoModuloOmitido('No se creó reporte Gemini porque Textos flotantes está desmarcado.');
  }

  const textosFlotantes = necesitaTextosFlotantes
    ? await generarTextosFlotantes({ entrada, origenMomentos, opciones })
    : resultadoModuloOmitido('Textos flotantes omitidos por selección del usuario.', { textos: [], cantidad: 0, rutaTextosFlotantes: null });
  const capasVideo = await construirCapasVideo({ entrada, subtitulos, textosFlotantes, opciones });
  const reporteTranscripcion = await crearReporteTranscripcion({ entrada, transcripcion, archivosTranscripcion, subtitulos, textosFlotantes, capasVideo, opciones });
  const diagnostico = await crearDiagnosticoTranscripcion({ entrada, opciones, transcripcion, subtitulos, geminiResultado, fallbackResultado, textosFlotantes, capasVideo });

  const resultado = {
    ok: true,
    etapa: 'transcripcion',
    omitido: false,
    mensaje: 'Transcripción procesada según checklist.',
    transcripcion,
    archivosTranscripcion,
    subtitulos,
    gemini: { ...geminiResultado, archivos: archivosGemini },
    fallback: fallbackResultado,
    textosFlotantes,
    capasVideo,
    reportes: { gemini: reporteGemini, transcripcion: reporteTranscripcion },
    diagnostico,
    creadoEn: new Date().toISOString()
  };

  return { ...resultado, impactoTexto: calcularImpactoTexto({ transcripcion: resultado, entendimiento, opciones }) };
}

export default { procesarTranscripcion };
