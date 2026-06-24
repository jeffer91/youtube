/*
  Nombre completo: video-impacto.service.js
  Ruta: /motor/metricas/video-impacto.service.js

  Función:
  - Calcular impacto estimado de cortes, zooms, barra, etiquetas, sonidos y exportación.
*/

import fs from 'fs';
import {
  crearMetricaModulo,
  limitarPorcentaje,
  porcentajeBooleano,
  porcentajeCondiciones,
  porcentajeRelacion,
  promedioPorcentajes,
  textoImpacto
} from './metricas-comunes.js';

function existeArchivo(ruta) {
  try {
    return Boolean(ruta && fs.existsSync(ruta) && fs.statSync(ruta).isFile() && fs.statSync(ruta).size > 0);
  } catch {
    return false;
  }
}

function duracionVideo(entendimiento = {}) {
  return Number(entendimiento?.analisis?.duracionSegundos || 0);
}

export function calcularImpactoEdicionDinamica({ edicionDinamica = {}, entendimiento = {}, opciones = {} } = {}) {
  const seleccion = opciones?.opcionesProcesamiento || opciones || {};
  const cortesActivos = seleccion.cortes ?? opciones.cortarSilencios ?? true;

  if (!cortesActivos) {
    return crearMetricaModulo({ id: 'cortes', nombre: 'Cortes automáticos', ejecutado: 0, impacto: 0, omitido: true, conclusion: 'Cortes automáticos omitidos por selección del usuario.' });
  }

  const resumen = edicionDinamica?.cortes?.resumen || {};
  const cantidadCortes = Number(resumen.cantidadCortesAplicados || 0);
  const segundosEliminados = Number(resumen.segundosEliminados || 0);
  const duracion = duracionVideo(entendimiento);
  const impactoDuracion = duracion > 0 ? porcentajeRelacion(segundosEliminados, duracion * 0.18) : 0;
  const impactoCortes = cantidadCortes > 0 ? Math.min(100, 20 + cantidadCortes * 12) : 0;
  const impacto = promedioPorcentajes([impactoDuracion, impactoCortes]);

  return crearMetricaModulo({
    id: 'cortes',
    nombre: 'Cortes automáticos',
    ejecutado: edicionDinamica?.omitido ? 50 : porcentajeCondiciones([edicionDinamica?.ok === true, edicionDinamica?.cortes]),
    impacto,
    omitido: Boolean(edicionDinamica?.omitido),
    conclusion: cantidadCortes > 0
      ? `${textoImpacto(impacto)} Se aplicaron ${cantidadCortes} cortes y se redujeron ${segundosEliminados.toFixed(1)} segundos.`
      : 'Se revisó el video, pero no se encontraron silencios útiles para cortar.',
    detalle: { cantidadCortes, segundosEliminados, duracionVideo: duracion, tieneMapaTiempo: Boolean(edicionDinamica?.mapaTiempo) }
  });
}

export function calcularImpactoVisual({ edicion = {}, edicionDinamica = {}, opciones = {} } = {}) {
  const seleccion = opciones?.opcionesProcesamiento || opciones || {};
  const visual = edicion?.visualDinamico || edicionDinamica?.visual || {};
  const sonidos = edicion?.sonidos || edicionDinamica?.sonidos || {};
  const eventosVisuales = visual?.eventosVisuales || visual?.eventos || [];
  const eventosSonido = sonidos?.eventosSonido || sonidos?.eventos || [];
  const filtroVideo = Boolean(edicion?.render?.filtroVideo);

  const zooms = seleccion.zooms === false
    ? crearMetricaModulo({ id: 'zooms', nombre: 'Zooms', ejecutado: 0, impacto: 0, omitido: true, conclusion: 'Zooms omitidos por selección del usuario.' })
    : crearMetricaModulo({ id: 'zooms', nombre: 'Zooms', ejecutado: porcentajeBooleano(filtroVideo), impacto: visual?.omitido ? 0 : limitarPorcentaje(eventosVisuales.length ? 45 + eventosVisuales.length * 6 : 25), omitido: Boolean(visual?.omitido), conclusion: eventosVisuales.length ? `Se prepararon ${eventosVisuales.length} eventos visuales.` : 'Filtro visual preparado, pero sin eventos visuales detallados.', detalle: { eventosVisuales: eventosVisuales.length, filtroVideo } });

  const barra = seleccion.barraProgreso === false
    ? crearMetricaModulo({ id: 'barraProgreso', nombre: 'Barra de progreso', ejecutado: 0, impacto: 0, omitido: true, conclusion: 'Barra de progreso omitida por selección del usuario.' })
    : crearMetricaModulo({ id: 'barraProgreso', nombre: 'Barra de progreso', ejecutado: porcentajeBooleano(filtroVideo), impacto: filtroVideo ? 100 : 0, conclusion: filtroVideo ? 'Barra o filtro visual preparado para el render final.' : 'No se confirmó filtro visual final.', detalle: { filtroVideo } });

  const etiquetas = seleccion.etiquetasVisuales === false
    ? crearMetricaModulo({ id: 'etiquetasVisuales', nombre: 'Etiquetas visuales', ejecutado: 0, impacto: 0, omitido: true, conclusion: 'Etiquetas visuales omitidas por selección del usuario.' })
    : crearMetricaModulo({ id: 'etiquetasVisuales', nombre: 'Etiquetas visuales', ejecutado: porcentajeBooleano(filtroVideo), impacto: visual?.omitido ? 0 : limitarPorcentaje(eventosVisuales.length ? 35 + eventosVisuales.length * 7 : 20), omitido: Boolean(visual?.omitido), conclusion: eventosVisuales.length ? `Etiquetas/eventos visuales preparados: ${eventosVisuales.length}.` : 'No se detectaron etiquetas visuales detalladas.', detalle: { eventosVisuales: eventosVisuales.length, filtroVideo } });

  const sonidosMetrica = seleccion.sonidos === false
    ? crearMetricaModulo({ id: 'sonidos', nombre: 'Sonidos automáticos', ejecutado: 0, impacto: 0, omitido: true, conclusion: 'Sonidos omitidos por selección del usuario.' })
    : crearMetricaModulo({ id: 'sonidos', nombre: 'Sonidos automáticos', ejecutado: sonidos?.omitido ? 0 : porcentajeBooleano(eventosSonido.length || sonidos?.audioConSonidos), impacto: sonidos?.omitido ? 0 : limitarPorcentaje(eventosSonido.length ? 30 + eventosSonido.length * 8 : sonidos?.audioConSonidos ? 55 : 0), omitido: Boolean(sonidos?.omitido), conclusion: eventosSonido.length ? `Sonidos aplicados: ${eventosSonido.length}.` : (sonidos?.audioConSonidos ? 'Audio con sonidos generado.' : 'No se confirmaron sonidos aplicados.'), detalle: { eventosSonido: eventosSonido.length, audioConSonidos: sonidos?.audioConSonidos || null } });

  return { zooms, barraProgreso: barra, etiquetasVisuales: etiquetas, sonidos: sonidosMetrica };
}

export function calcularImpactoExportacion({ salida = {}, opciones = {} } = {}) {
  const exportacionActiva = opciones?.opcionesProcesamiento?.exportacion ?? opciones?.exportacion ?? true;

  if (!exportacionActiva) {
    return crearMetricaModulo({ id: 'exportacion', nombre: 'Exportación', ejecutado: 0, impacto: 0, entrega: 0, omitido: true, conclusion: 'Exportación omitida por selección del usuario.' });
  }

  const archivoExiste = existeArchivo(salida?.rutaExportada);
  const urlPublica = Boolean(salida?.urlPublica);
  const nombreExportado = Boolean(salida?.nombreExportado);
  const pesoValido = Number(salida?.pesoBytes || 0) > 0 || archivoExiste;
  const porcentaje = porcentajeCondiciones([salida?.ok === true, archivoExiste, urlPublica, nombreExportado, pesoValido]);

  return crearMetricaModulo({
    id: 'exportacion',
    nombre: 'Exportación',
    ejecutado: porcentaje,
    impacto: porcentaje,
    entrega: porcentaje,
    error: porcentaje < 100,
    conclusion: porcentaje === 100 ? 'El archivo final fue creado, validado y tiene URL pública.' : 'La exportación no completó todas las condiciones de entrega.',
    detalle: { archivoExiste, urlPublica, nombreExportado, pesoValido, rutaExportada: salida?.rutaExportada || null, url: salida?.urlPublica || null }
  });
}

export default { calcularImpactoEdicionDinamica, calcularImpactoVisual, calcularImpactoExportacion };
