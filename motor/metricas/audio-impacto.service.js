/*
  Nombre completo: audio-impacto.service.js
  Ruta: /motor/metricas/audio-impacto.service.js

  Función:
  - Calcular ejecución e impacto estimado del módulo de audio.
  - Diferenciar entre procesar audio y que el resultado realmente cambie.
*/

import fs from 'fs';
import {
  crearMetricaModulo,
  limitarPorcentaje,
  porcentajeCondiciones,
  textoImpacto
} from './metricas-comunes.js';

function existeArchivo(ruta) {
  try {
    return Boolean(ruta && fs.existsSync(ruta) && fs.statSync(ruta).isFile() && fs.statSync(ruta).size > 0);
  } catch {
    return false;
  }
}

function audioUsadoEnSalida(salida = {}) {
  const tipo = salida?.audio?.tipo || '';
  return ['mejorado', 'sonidos-edicion', 'video-render'].includes(tipo);
}

export function calcularImpactoAudio({ audio = {}, salida = {}, opciones = {}, entendimiento = {} } = {}) {
  const seleccionado = opciones?.opcionesProcesamiento?.mejorarAudio ?? opciones?.mejorarAudio ?? true;
  const tieneAudioOriginal = Boolean(entendimiento?.analisis?.tieneAudio ?? audio?.analisisUsado?.tieneAudio);

  if (!seleccionado) {
    return crearMetricaModulo({
      id: 'audio',
      nombre: 'Audio',
      ejecutado: 0,
      impacto: 0,
      omitido: true,
      conclusion: 'Audio omitido por selección del usuario.',
      detalle: { seleccionado: false }
    });
  }

  if (!tieneAudioOriginal) {
    return crearMetricaModulo({
      id: 'audio',
      nombre: 'Audio',
      ejecutado: 100,
      impacto: 0,
      omitido: true,
      conclusion: 'Se revisó el audio, pero el video no tiene pista de audio detectable.',
      detalle: { tieneAudioOriginal: false }
    });
  }

  const archivoGenerado = existeArchivo(audio?.rutaAudioMejorado);
  const filtroAplicado = Boolean(audio?.render?.filtroAudio);
  const salidaUsaAudio = audioUsadoEnSalida(salida);
  const fueOmitido = Boolean(audio?.omitido);

  const ejecutado = fueOmitido
    ? 60
    : porcentajeCondiciones([audio?.ok === true, archivoGenerado, filtroAplicado]);

  let impacto = 0;

  if (salida?.audio?.tipo === 'sonidos-edicion') impacto = 90;
  else if (salida?.audio?.tipo === 'mejorado') impacto = 75;
  else if (salida?.audio?.tipo === 'video-render') impacto = 60;
  else if (archivoGenerado && filtroAplicado) impacto = 45;
  else if (audio?.ok && !fueOmitido) impacto = 25;

  if (!salidaUsaAudio && archivoGenerado) impacto = Math.min(impacto, 35);
  if (fueOmitido) impacto = 0;

  const impactoFinal = limitarPorcentaje(impacto);

  return crearMetricaModulo({
    id: 'audio',
    nombre: 'Audio',
    ejecutado,
    impacto: impactoFinal,
    omitido: fueOmitido,
    conclusion: salidaUsaAudio
      ? `${textoImpacto(impactoFinal)} El audio procesado sí fue usado en la exportación.`
      : `${textoImpacto(impactoFinal)} El audio final no confirma uso de pista mejorada.`,
    detalle: {
      tieneAudioOriginal,
      archivoGenerado,
      filtroAplicado,
      salidaUsaAudio,
      tipoSalidaAudio: salida?.audio?.tipo || null,
      rutaAudioMejorado: audio?.rutaAudioMejorado || null,
      nombreAudioMejorado: audio?.nombreAudioMejorado || null,
      nota: 'Impacto estimado con base en archivos generados y audio usado en exportación; no es análisis acústico de onda.'
    },
    evidencias: [
      audio?.mensaje,
      salida?.audio?.mensaje
    ].filter(Boolean)
  });
}

export default { calcularImpactoAudio };
