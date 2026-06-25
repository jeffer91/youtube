import { extraerTextoCompleto, extraerPalabrasClave, recortarTexto } from '../utilidades-extraer-texto.js';
import { INTELIGENCIA_CONFIG } from '../inteligencia.config.js';

function capitalizar(texto = '') {
  const limpio = String(texto || '').trim();
  if (!limpio) return '';
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function limpiarHashtag(palabra = '') {
  return String(palabra || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').trim();
}

function construirTituloBase(palabrasClave = [], perfil = null) {
  const principal = palabrasClave[0]?.palabra || 'video';
  const secundario = palabrasClave[1]?.palabra || perfil?.nombre || 'contenido';
  return { principal: capitalizar(principal), secundario: capitalizar(secundario) };
}

export function generarSeoVideo({ transcripcion = {}, hook = null, perfilVisual = null, opciones = {} } = {}) {
  const texto = extraerTextoCompleto(transcripcion);
  const maxTitulos = Number(opciones.maxTitulosSeo || INTELIGENCIA_CONFIG.maxTitulos);
  const maxHashtags = Number(opciones.maxHashtagsSeo || INTELIGENCIA_CONFIG.maxHashtags);
  const palabrasClave = extraerPalabrasClave(texto, INTELIGENCIA_CONFIG.maxPalabrasClave);
  const base = construirTituloBase(palabrasClave, perfilVisual);
  const hookTexto = hook?.texto || '';

  const titulos = [
    hookTexto ? recortarTexto(hookTexto.replace(/[¿?¡!]/g, ''), 70) : `${base.principal}: lo más importante`,
    `${base.principal} explicado fácil`,
    `Evita este error sobre ${base.principal}`,
    `${base.principal} y ${base.secundario}: guía rápida`,
    `Lo que debes saber sobre ${base.principal}`
  ].filter(Boolean).slice(0, maxTitulos);

  const hashtagsBase = palabrasClave.map((item) => limpiarHashtag(item.palabra)).filter((tag) => tag.length >= 4);
  const hashtags = [...new Set([
    ...(perfilVisual?.id ? [limpiarHashtag(perfilVisual.id)] : []),
    ...hashtagsBase,
    'AutoVideoJeff',
    'VideoEditado'
  ])].slice(0, maxHashtags).map((tag) => `#${tag}`);

  const descripcion = texto
    ? `${recortarTexto(texto, 240)}\n\n${hashtags.join(' ')}`.trim()
    : `Video editado automáticamente con perfil ${perfilVisual?.nombre || 'general'}.\n\n${hashtags.join(' ')}`.trim();

  return {
    ok: true,
    estado: texto ? 'GENERADO_LOCAL' : 'GENERADO_BASICO',
    titulos,
    tituloPrincipal: titulos[0] || 'Video editado automáticamente',
    descripcion,
    hashtags,
    palabrasClave,
    perfil: perfilVisual?.id || null,
    recomendaciones: [
      'Usar el primer título si el video es corto.',
      'Elegir el título con pregunta o problema si se busca mayor retención.',
      'Revisar hashtags antes de publicar según la plataforma.'
    ]
  };
}

export default generarSeoVideo;
