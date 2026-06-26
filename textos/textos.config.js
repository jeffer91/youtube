/*
  Modulo: textos
  Funcion: reglas para textos relevantes, graficos y tablas visuales.
*/

export const TEXTOS_CONFIG = Object.freeze({
  version: '1.0.0',
  tipos: Object.freeze({
    titulo: 'titulo',
    frase: 'frase',
    datoClave: 'dato_clave',
    etiqueta: 'etiqueta',
    aviso: 'aviso',
    grafico: 'grafico',
    tabla: 'tabla'
  }),
  limitesPorPerfil: Object.freeze({
    institucional: 4,
    creciaula: 7,
    general: 6,
    '11-contra-11': 8,
    'jeff-isekai': 8,
    'el-don-historia': 7,
    'jeff-verso': 7
  }),
  duracionSugerida: Object.freeze({
    titulo: 3.2,
    frase: 2.6,
    dato_clave: 3.8,
    etiqueta: 2.2,
    aviso: 2.8,
    grafico: 5,
    tabla: 5
  })
});

export function obtenerLimiteTextosPorPerfil(perfil = 'general') {
  return TEXTOS_CONFIG.limitesPorPerfil[perfil] || TEXTOS_CONFIG.limitesPorPerfil.general;
}
