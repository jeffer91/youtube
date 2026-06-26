/* Modulo textos: crea capas simples de texto. */

import { TEXTOS_CONFIG } from './textos.config.js';

function acortar(texto = '', max = 72) {
  const limpio = String(texto).replace(/\s+/g, ' ').trim();
  return limpio.length <= max ? limpio : `${limpio.slice(0, max).trim()}...`;
}

export function generarTextosPantalla({ textos = [], perfil = 'general', plataforma = 'tiktok' } = {}) {
  return textos.map((item, indice) => {
    const tipo = item.tipo || TEXTOS_CONFIG.tipos.frase;
    const inicio = Number(item.inicio ?? 0);
    const duracion = TEXTOS_CONFIG.duracionSugerida[tipo] || 3;
    return {
      id: item.id || `texto-${indice + 1}`,
      tipo,
      texto: acortar(item.texto),
      inicio,
      fin: Number(item.fin ?? inicio + duracion),
      estilo: { perfil, plataforma, contorno: true, sombra: true },
      posicion: item.posicion || 'zona_segura_superior'
    };
  });
}
