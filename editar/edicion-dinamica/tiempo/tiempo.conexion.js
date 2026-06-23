import path from 'path';
import { escribirJson, asegurarCarpeta } from '../../../comun/archivos.js';
import { construirCapasVideo } from '../../../transcripcion/capas/construir-capas-video.js';
import { crearMapaTiempoDesdeSegmentos } from './crear-mapa-tiempo.js';
import { ajustarTranscripcionDinamica } from './ajustar-transcripcion-dinamica.js';
import { ajustarSubtitulosDinamicos } from './ajustar-subtitulos.js';
import { ajustarTextosFlotantesDinamicos } from './ajustar-textos-flotantes.js';
import { ajustarMomentosImportantesDinamicos } from './ajustar-momentos-importantes.js';

function crearRespuestaSinMapa({ mensaje, carpetaTiempo }) {
  return { ok: true, omitido: true, etapa: 'edicion-dinamica-tiempo', mensaje, mapaTiempo: null, transcripcionAjustada: null, subtitulosAjustados: null, textosFlotantesAjustados: null, momentosImportantesAjustados: null, capasVideoAjustadas: null, carpetaTiempo, creadoEn: new Date().toISOString() };
}

function construirPaqueteTranscripcionAjustado({ transcripcion, ajusteTranscripcion, subtitulosAjustados, textosFlotantesAjustados, geminiAjustado, fallbackAjustado, capasVideoAjustadas }) {
  if (!transcripcion || ajusteTranscripcion?.omitido) return null;
  const paqueteBase = ajusteTranscripcion.paquete || transcripcion;
  if (!paqueteBase || typeof paqueteBase !== 'object') return null;
  return { ...paqueteBase, subtitulos: subtitulosAjustados || paqueteBase.subtitulos || null, textosFlotantes: textosFlotantesAjustados || paqueteBase.textosFlotantes || null, gemini: geminiAjustado || paqueteBase.gemini || null, fallback: fallbackAjustado || paqueteBase.fallback || null, capasVideo: capasVideoAjustadas || paqueteBase.capasVideo || null, edicionDinamica: { ...(paqueteBase.edicionDinamica || {}), ajustada: true, capasVideoReconstruidas: Boolean(capasVideoAjustadas && !capasVideoAjustadas.omitido), motivo: 'Los tiempos fueron ajustados después de cortar silencios.' } };
}

export async function procesarTiempoDinamico({ entrada, entendimiento, transcripcion = null, cortes = null, config, carpetaEdicionDinamica, opciones = {} } = {}) {
  const carpetaTiempo = path.join(carpetaEdicionDinamica, 'tiempo');
  asegurarCarpeta(carpetaTiempo);

  if (!cortes || cortes.omitido || !cortes.planCortes?.segmentosConservados?.length) {
    return crearRespuestaSinMapa({ mensaje: 'No se creó mapa de tiempo porque no se aplicaron cortes.', carpetaTiempo });
  }

  const plan = cortes.planCortes;
  const mapaTiempo = crearMapaTiempoDesdeSegmentos({ segmentosConservados: plan.segmentosConservados, duracionOriginal: plan.duracionOriginal || entendimiento?.analisis?.duracionSegundos || null, duracionEditada: plan.duracionEditada || null, cortes: plan.cortes || [] });
  const ajusteTranscripcion = ajustarTranscripcionDinamica({ paqueteTranscripcion: transcripcion, mapaTiempo });
  const segmentosAjustados = ajusteTranscripcion?.segmentosAjustados || [];

  const subtitulosAjustados = await ajustarSubtitulosDinamicos({ subtitulos: transcripcion?.subtitulos || null, segmentosAjustados, carpetaTiempo, opciones });
  const textosFlotantesAjustados = ajustarTextosFlotantesDinamicos({ textosFlotantes: transcripcion?.textosFlotantes || null, mapaTiempo });
  const geminiAjustado = ajustarMomentosImportantesDinamicos({ origenMomentos: transcripcion?.gemini || null, mapaTiempo });
  const fallbackAjustado = ajustarMomentosImportantesDinamicos({ origenMomentos: transcripcion?.fallback || null, mapaTiempo });

  const capasVideoAjustadas = await construirCapasVideo({ entrada, subtitulos: subtitulosAjustados, textosFlotantes: textosFlotantesAjustados, opciones });

  const transcripcionAjustada = construirPaqueteTranscripcionAjustado({ transcripcion, ajusteTranscripcion, subtitulosAjustados, textosFlotantesAjustados, geminiAjustado, fallbackAjustado, capasVideoAjustadas });

  const resultado = { ok: true, omitido: false, etapa: 'edicion-dinamica-tiempo', mensaje: 'Mapa de tiempo, transcripción, subtítulos, textos y capas de video ajustados correctamente.', mapaTiempo, transcripcionAjustada, ajusteTranscripcion, subtitulosAjustados, textosFlotantesAjustados, momentosImportantesAjustados: { gemini: geminiAjustado, fallback: fallbackAjustado }, capasVideoAjustadas, pendienteAjusteTranscripcion: false, config: { intensidad: config?.intensidad || null }, opciones: { ajustarSubtitulos: true, ajustarTextosFlotantes: true, ajustarMomentosImportantes: true, reconstruirCapasVideo: true, ...opciones }, carpetaTiempo, proyectoId: entrada?.proyecto?.id || null, creadoEn: new Date().toISOString() };

  await escribirJson(path.join(carpetaTiempo, 'mapa-tiempo.json'), mapaTiempo);
  await escribirJson(path.join(carpetaTiempo, 'transcripcion-ajustada.json'), transcripcionAjustada || ajusteTranscripcion);
  await escribirJson(path.join(carpetaTiempo, 'textos-flotantes-ajustados.json'), textosFlotantesAjustados);
  await escribirJson(path.join(carpetaTiempo, 'momentos-importantes-ajustados.json'), resultado.momentosImportantesAjustados);
  await escribirJson(path.join(carpetaTiempo, 'capas-video-ajustadas.json'), capasVideoAjustadas);
  await escribirJson(path.join(carpetaTiempo, 'resultado-tiempo.json'), resultado);

  return resultado;
}

export default procesarTiempoDinamico;
