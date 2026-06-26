/*
  Modulo: visual
  Funcion: configuracion base para sujeto, fondos, zooms, animaciones y efectos.
*/

export const VISUAL_CONFIG = Object.freeze({
  version: '1.0.0',
  modosEncuadre: Object.freeze({
    automatico: 'automatico',
    cercano: 'cercano',
    medio: 'medio',
    pequenoConFondo: 'pequeno_con_fondo'
  }),
  intensidadPorPerfil: Object.freeze({
    institucional: 'limpia',
    creciaula: 'clara',
    general: 'equilibrada',
    '11-contra-11': 'dinamica',
    'jeff-isekai': 'muy_dinamica',
    'el-don-historia': 'narrativa',
    'jeff-verso': 'cinematica'
  }),
  zooms: Object.freeze({
    suave: Object.freeze({ escalaMin: 1, escalaMax: 1.06, duracion: 2.4 }),
    dinamico: Object.freeze({ escalaMin: 1, escalaMax: 1.14, duracion: 1.6 }),
    fuerte: Object.freeze({ escalaMin: 1, escalaMax: 1.22, duracion: 1.1 })
  }),
  efectos: Object.freeze({
    transicionSuave: 'transicion_suave',
    resalteTexto: 'resalte_texto',
    fondoContextual: 'fondo_contextual',
    camaraDinamica: 'camara_dinamica'
  })
});

export function obtenerIntensidadVisual(perfil = 'general') {
  return VISUAL_CONFIG.intensidadPorPerfil[perfil] || VISUAL_CONFIG.intensidadPorPerfil.general;
}
