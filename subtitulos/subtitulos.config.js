/*
  Modulo: subtitulos
  Funcion: estilos base por plataforma y reglas de zona segura.
*/

export const SUBTITULOS_CONFIG = Object.freeze({
  version: '1.0.0',
  estilos: Object.freeze({
    clasico: Object.freeze({ id: 'clasico', nombre: 'Clasico', modo: 'frase', contorno: true, sombra: true }),
    dinamico: Object.freeze({ id: 'dinamico', nombre: 'Dinamico', modo: 'palabra', contorno: true, sombra: true }),
    frases: Object.freeze({ id: 'frases', nombre: 'Frases claras', modo: 'frase', contorno: true, sombra: true })
  }),
  estiloPorPlataforma: Object.freeze({
    tiktok: 'dinamico',
    reels: 'dinamico',
    shorts: 'dinamico',
    youtube: 'frases',
    facebook: 'frases',
    instagram: 'clasico'
  }),
  maxCaracteresPorLinea: Object.freeze({
    '9:16': 28,
    '16:9': 42,
    '1:1': 32
  }),
  posicionBase: Object.freeze({
    vertical: 'inferior_segura',
    horizontal: 'inferior_centrada',
    cuadrado: 'inferior_compacta'
  })
});

export function obtenerEstiloSubtitulo(estiloId = 'dinamico') {
  return SUBTITULOS_CONFIG.estilos[estiloId] || SUBTITULOS_CONFIG.estilos.dinamico;
}
