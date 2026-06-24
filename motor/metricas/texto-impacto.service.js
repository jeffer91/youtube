/*
  Nombre completo: texto-impacto.service.js
  Ruta: /motor/metricas/texto-impacto.service.js

  Función:
  - Calcular impacto estimado de transcripción, subtítulos y textos flotantes.
*/

import {
  crearMetricaModulo,
  limitarPorcentaje,
  porcentajeCondiciones,
  porcentajeRelacion,
  promedioPorcentajes,
  textoImpacto
} from './metricas-comunes.js';

function obtenerSegmentos(transcripcion = {}) {
  return transcripcion?.transcripcion?.segmentos || transcripcion?.segmentos || [];
}

function duracionSegmentos(segmentos = []) {
  return segmentos.reduce((total, segmento) => {
    const inicio = Number(segmento.inicio ?? segmento.start ?? 0);
    const fin = Number(segmento.fin ?? segmento.end ?? 0);
    return total + Math.max(0, fin - inicio);
  }, 0);
}

function calcularCoberturaSegmentos({ transcripcion = {}, entendimiento = {} } = {}) {
  const segmentos = obtenerSegmentos(transcripcion);
  const duracionVideo = Number(entendimiento?.analisis?.duracionSegundos || 0);
  if (!segmentos.length || duracionVideo <= 0) return segmentos.length > 0 ? 60 : 0;
  return porcentajeRelacion(duracionSegmentos(segmentos), duracionVideo);
}

export function calcularImpactoTexto({ transcripcion = {}, entendimiento = {}, opciones = {} } = {}) {
  const seleccion = opciones?.opcionesProcesamiento || opciones || {};
  const transcripcionActiva = seleccion.transcripcion ?? opciones.crearTranscripcion ?? true;
  const subtitulosActivos = seleccion.subtitulos ?? opciones.agregarSubtitulos ?? true;
  const textosActivos = seleccion.textosFlotantes ?? opciones.agregarTextosFlotantes ?? true;

  const segmentos = obtenerSegmentos(transcripcion);
  const cantidadSegmentos = Number(transcripcion?.transcripcion?.cantidadSegmentos || segmentos.length || 0);
  const cobertura = calcularCoberturaSegmentos({ transcripcion, entendimiento });
  const subtitulosGenerados = Boolean(transcripcion?.capasVideo?.usarSubtitulos || transcripcion?.subtitulos?.srt || transcripcion?.subtitulos?.ass);
  const cantidadTextos = Number(transcripcion?.textosFlotantes?.cantidad || transcripcion?.textosFlotantes?.textos?.length || 0);
  const textosGenerados = cantidadTextos > 0;

  const metricaTranscripcion = !transcripcionActiva
    ? crearMetricaModulo({ id: 'transcripcion', nombre: 'Transcripción', ejecutado: 0, impacto: 0, omitido: true, conclusion: 'Transcripción omitida por selección del usuario.' })
    : crearMetricaModulo({
      id: 'transcripcion',
      nombre: 'Transcripción',
      ejecutado: transcripcion?.omitido ? 50 : porcentajeCondiciones([transcripcion?.ok === true, cantidadSegmentos > 0]),
      impacto: transcripcion?.omitido ? 0 : promedioPorcentajes([cantidadSegmentos > 0 ? 100 : 0, cobertura]),
      omitido: Boolean(transcripcion?.omitido),
      conclusion: cantidadSegmentos > 0 ? `${textoImpacto(cobertura)} Se detectaron ${cantidadSegmentos} segmentos.` : 'No se detectaron segmentos útiles.',
      detalle: { cantidadSegmentos, coberturaVideo: cobertura }
    });

  const impactoSubtitulos = subtitulosGenerados ? promedioPorcentajes([100, cobertura]) : 0;
  const metricaSubtitulos = !subtitulosActivos
    ? crearMetricaModulo({ id: 'subtitulos', nombre: 'Subtítulos', ejecutado: 0, impacto: 0, omitido: true, conclusion: 'Subtítulos omitidos por selección del usuario.' })
    : crearMetricaModulo({
      id: 'subtitulos',
      nombre: 'Subtítulos',
      ejecutado: porcentajeCondiciones([transcripcionActiva, subtitulosGenerados]),
      impacto: impactoSubtitulos,
      omitido: Boolean(transcripcion?.subtitulos?.omitido),
      conclusion: subtitulosGenerados ? `Subtítulos generados con cobertura estimada de ${cobertura}%.` : 'No se generaron subtítulos aplicables.',
      detalle: { subtitulosGenerados, coberturaVideo: cobertura }
    });

  const impactoTextos = textosGenerados
    ? limitarPorcentaje(Math.min(100, 25 + (cantidadTextos * 12)))
    : 0;

  const metricaTextos = !textosActivos
    ? crearMetricaModulo({ id: 'textosFlotantes', nombre: 'Textos flotantes', ejecutado: 0, impacto: 0, omitido: true, conclusion: 'Textos flotantes omitidos por selección del usuario.' })
    : crearMetricaModulo({
      id: 'textosFlotantes',
      nombre: 'Textos flotantes',
      ejecutado: porcentajeCondiciones([transcripcionActiva, textosGenerados]),
      impacto: impactoTextos,
      omitido: Boolean(transcripcion?.textosFlotantes?.omitido),
      conclusion: textosGenerados ? `${textoImpacto(impactoTextos)} Se crearon ${cantidadTextos} textos flotantes.` : 'No se detectaron momentos suficientes para textos flotantes.',
      detalle: { cantidadTextos, textosGenerados }
    });

  return {
    transcripcion: metricaTranscripcion,
    subtitulos: metricaSubtitulos,
    textosFlotantes: metricaTextos
  };
}

export default { calcularImpactoTexto };
