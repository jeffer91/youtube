/*
  Modulo: textos
  Funcion: detectar frases o ideas que pueden convertirse en textos de pantalla.
*/

import { obtenerLimiteTextosPorPerfil, TEXTOS_CONFIG } from './textos.config.js';

const PALABRAS_FUERZA = ['importante', 'clave', 'ojo', 'atencion', 'recuerda', 'nunca', 'siempre', 'problema', 'solucion', 'resultado'];

function puntuarSegmento(segmento = {}) {
  const texto = String(segmento.texto || segmento.text || '').trim();
  const largo = texto.length;
  const lower = texto.toLowerCase();
  const fuerza = PALABRAS_FUERZA.filter((palabra) => lower.includes(palabra)).length;
  const puntuacion = fuerza * 3 + (largo >= 45 && largo <= 160 ? 2 : 0) + (/[!?]/.test(texto) ? 1 : 0);
  return { texto, puntuacion };
}

export function detectarTextosRelevantes({ segmentos = [], perfil = 'general' } = {}) {
  const limite = obtenerLimiteTextosPorPerfil(perfil);
  const candidatos = segmentos
    .map((segmento, indice) => {
      const puntaje = puntuarSegmento(segmento);
      return {
        id: `texto-${indice + 1}`,
        tipo: puntaje.puntuacion >= 5 ? TEXTOS_CONFIG.tipos.datoClave : TEXTOS_CONFIG.tipos.frase,
        texto: puntaje.texto,
        inicio: Number(segmento.inicio ?? segmento.start ?? 0),
        fin: Number(segmento.fin ?? segmento.end ?? 0),
        puntuacion: puntaje.puntuacion
      };
    })
    .filter((item) => item.texto && item.puntuacion > 0)
    .sort((a, b) => b.puntuacion - a.puntuacion)
    .slice(0, limite)
    .sort((a, b) => a.inicio - b.inicio);

  return {
    ok: true,
    perfil,
    total: candidatos.length,
    textos: candidatos,
    creadoEn: new Date().toISOString()
  };
}
