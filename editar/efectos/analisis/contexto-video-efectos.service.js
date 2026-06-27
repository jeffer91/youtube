/*
  Bloque 2: Analisis de contexto visual
  Funcion: resumir el video para que el planificador sepa que efectos convienen.
*/

import { filtrarEfectosPorPerfil, obtenerPerfilEfectos, obtenerIntensidadEfectos } from '../catalogo/index.js';
import { detectarMomentosEfecto } from './detectar-momentos-efecto.service.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function normalizarPerfil(perfil = 'general') {
  return String(perfil || 'general').trim().toLowerCase();
}

function obtenerDuracion({ entendimiento = null, edicionDinamica = null } = {}) {
  return numero(edicionDinamica?.mapaTiempo?.duracionEditada || edicionDinamica?.cortes?.resumen?.duracionEditada || entendimiento?.analisis?.duracionSegundos, 0);
}

function clasificarDuracion(duracion = 0) {
  const valor = numero(duracion, 0);
  if (valor <= 0) return 'desconocida';
  if (valor <= 20) return 'corta';
  if (valor <= 75) return 'media';
  return 'larga';
}

function detectarNecesidadVisual({ duracion, transcripcion = null, edicionDinamica = null, perfil = 'general' } = {}) {
  const segmentos = numero(transcripcion?.transcripcion?.cantidadSegmentos || transcripcion?.segmentos?.length, 0);
  const textos = numero(transcripcion?.textosFlotantes?.cantidad || transcripcion?.textosFlotantes?.textos?.length, 0);
  const cortes = numero(edicionDinamica?.cortes?.resumen?.cantidadCortesAplicados, 0);
  const perfilId = normalizarPerfil(perfil);
  const necesidades = [];

  if (cortes === 0) necesidades.push('video_estatico');
  if (segmentos === 0) necesidades.push('sin_transcripcion_util');
  if (textos === 0) necesidades.push('sin_textos_visuales');
  if (duracion > 45) necesidades.push('mantener_retencion');
  if (['11-contra-11', 'jeff-isekai'].includes(perfilId)) necesidades.push('alta_energia');
  if (['institucional', 'creciaula'].includes(perfilId)) necesidades.push('claridad_visual');
  if (['el-don-historia'].includes(perfilId)) necesidades.push('narrativa_visual');

  return necesidades;
}

function resumirCompatibilidadEfectos(efectos = []) {
  return efectos.reduce((acc, efecto) => {
    acc.total += 1;
    acc.porCategoria[efecto.categoria] = (acc.porCategoria[efecto.categoria] || 0) + 1;
    if (efecto.requiereTexto) acc.requierenTexto += 1;
    if (efecto.requiereTranscripcion) acc.requierenTranscripcion += 1;
    if (efecto.requiereMomentoClave) acc.requierenMomentoClave += 1;
    return acc;
  }, { total: 0, porCategoria: {}, requierenTexto: 0, requierenTranscripcion: 0, requierenMomentoClave: 0 });
}

export function analizarContextoVideoEfectos({ entrada = null, entendimiento = null, transcripcion = null, edicionDinamica = null, opciones = {} } = {}) {
  const perfilId = normalizarPerfil(opciones?.perfil || entrada?.proyecto?.perfil || 'general');
  const perfil = obtenerPerfilEfectos(perfilId);
  const intensidad = obtenerIntensidadEfectos(opciones?.intensidadEfectos || perfil.intensidadSugerida);
  const duracion = obtenerDuracion({ entendimiento, edicionDinamica });
  const momentos = detectarMomentosEfecto({ transcripcion, entendimiento, duracion });
  const efectosCompatibles = filtrarEfectosPorPerfil(perfil.id);
  const necesidades = detectarNecesidadVisual({ duracion, transcripcion, edicionDinamica, perfil: perfil.id });

  return {
    ok: true,
    tipo: 'contexto-video-efectos',
    perfil,
    intensidad,
    duracionSegundos: duracion,
    tipoDuracion: clasificarDuracion(duracion),
    plataforma: opciones?.plataforma || entrada?.proyecto?.plataforma || 'tiktok',
    formato: opciones?.formato || '9:16',
    tieneTranscripcion: Boolean(transcripcion && !transcripcion.omitido),
    tieneTextosFlotantes: numero(transcripcion?.textosFlotantes?.cantidad || transcripcion?.textosFlotantes?.textos?.length, 0) > 0,
    edicionDinamicaActiva: Boolean(edicionDinamica?.activo && !edicionDinamica?.omitido),
    necesidades,
    momentos,
    efectosCompatibles: resumirCompatibilidadEfectos(efectosCompatibles),
    idsEfectosCompatibles: efectosCompatibles.map((efecto) => efecto.id),
    mensaje: `Contexto visual listo para perfil ${perfil.nombre}.`
  };
}

export default analizarContextoVideoEfectos;
