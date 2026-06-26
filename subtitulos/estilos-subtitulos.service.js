/*
  Modulo: subtitulos
  Funcion: resolver estilos visuales de subtitulos con contorno.
*/

import { obtenerEstiloSubtitulo, SUBTITULOS_CONFIG } from './subtitulos.config.js';

export function resolverEstiloSubtitulo({ plataforma = 'tiktok', estilo = null, perfil = 'general' } = {}) {
  const estiloId = estilo || SUBTITULOS_CONFIG.estiloPorPlataforma[plataforma] || 'dinamico';
  const base = obtenerEstiloSubtitulo(estiloId);

  return {
    ...base,
    plataforma,
    perfil,
    fuente: perfil === 'institucional' ? 'Arial' : 'Montserrat',
    peso: perfil === 'institucional' ? 700 : 800,
    color: 'white',
    contornoColor: 'black',
    contornoAncho: plataforma === 'youtube' ? 2 : 3,
    fondo: 'transparente',
    evitarTaparSujeto: true
  };
}

export function crearCssSubtitulo(estilo = {}) {
  return {
    fontFamily: estilo.fuente || 'Montserrat',
    fontWeight: estilo.peso || 800,
    color: estilo.color || 'white',
    textShadow: estilo.sombra ? '0 2px 8px rgba(0,0,0,.65)' : 'none',
    WebkitTextStroke: estilo.contorno ? `${estilo.contornoAncho || 2}px ${estilo.contornoColor || 'black'}` : '0'
  };
}
