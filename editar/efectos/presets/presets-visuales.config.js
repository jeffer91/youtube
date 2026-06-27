/*
  Bloque 14: Presets visuales por perfil
  Función: definir estilo visual base para cada perfil de AutoVideoJeff.
*/

export const PRESETS_VISUALES_EFECTOS = Object.freeze({
  general: {
    id: 'general',
    nombre: 'General potente',
    intensidadDefault: 'normal',
    maxEfectosDefault: 12,
    selectorDefault: 'local',
    categoriasPrioritarias: ['movimiento', 'texto', 'color', 'overlay'],
    necesidadesVisuales: ['mantener_retencion', 'claridad_visual'],
    efectosBase: ['micro_movimiento', 'nitidez_rostro', 'barra_progreso'],
    efectosPrioritarios: ['zoom_suave', 'texto_impacto', 'brillo_controlado', 'lower_third'],
    efectosBloqueados: [],
    guia: 'Estilo limpio, dinámico y útil para videos generales.'
  },
  '11-contra-11': {
    id: '11-contra-11',
    nombre: '11 contra 11',
    intensidadDefault: 'fuerte',
    maxEfectosDefault: 16,
    selectorDefault: 'local',
    categoriasPrioritarias: ['movimiento', 'ritmo', 'texto', 'color', 'overlay'],
    necesidadesVisuales: ['alta_energia', 'mantener_retencion', 'claridad_visual'],
    efectosBase: ['zoom_deportivo', 'color_futbol_vibrante', 'barra_progreso', 'nitidez_rostro'],
    efectosPrioritarios: ['marcador_futbol', 'texto_impacto', 'borde_deportivo', 'flash_suave'],
    efectosBloqueados: ['tono_frio_profesional'],
    guia: 'Estilo deportivo, rápido, vibrante y con lectura clara de jugadas.'
  },
  'jeff-isekai': {
    id: 'jeff-isekai',
    nombre: 'Jeff Isekai',
    intensidadDefault: 'fuerte',
    maxEfectosDefault: 16,
    selectorDefault: 'local',
    categoriasPrioritarias: ['movimiento', 'color', 'texto', 'transicion'],
    necesidadesVisuales: ['alta_energia', 'narrativa_visual', 'mantener_retencion'],
    efectosBase: ['color_anime_vivo', 'punch_in_fuerte', 'nitidez_rostro'],
    efectosPrioritarios: ['palabra_clave', 'flash_suave', 'pregunta_en_pantalla', 'frase_destacada'],
    efectosBloqueados: ['color_institucional_limpio', 'tono_frio_profesional'],
    guia: 'Estilo animado, expresivo, con énfasis narrativo y visual llamativo.'
  },
  creciaula: {
    id: 'creciaula',
    nombre: 'Creciaula',
    intensidadDefault: 'normal',
    maxEfectosDefault: 12,
    selectorDefault: 'local',
    categoriasPrioritarias: ['texto', 'overlay', 'color', 'movimiento'],
    necesidadesVisuales: ['claridad_visual', 'mantener_retencion'],
    efectosBase: ['color_educacion_claro', 'micro_movimiento', 'barra_progreso'],
    efectosPrioritarios: ['dato_rapido', 'bloque_contexto', 'lower_third', 'tarjeta_resumen'],
    efectosBloqueados: ['flash_suave', 'borde_deportivo'],
    guia: 'Estilo educativo, claro, ordenado y fácil de seguir.'
  },
  institucional: {
    id: 'institucional',
    nombre: 'Institucional',
    intensidadDefault: 'suave',
    maxEfectosDefault: 8,
    selectorDefault: 'local',
    categoriasPrioritarias: ['color', 'texto', 'overlay'],
    necesidadesVisuales: ['claridad_visual'],
    efectosBase: ['color_institucional_limpio', 'nitidez_rostro', 'borde_institucional'],
    efectosPrioritarios: ['lower_third', 'aviso_importante', 'bloque_contexto'],
    efectosBloqueados: ['flash_suave', 'zoom_deportivo', 'borde_deportivo', 'color_anime_vivo'],
    guia: 'Estilo sobrio, profesional, limpio y sin exceso de animación.'
  },
  'el-don-historia': {
    id: 'el-don-historia',
    nombre: 'El Don Historia',
    intensidadDefault: 'normal',
    maxEfectosDefault: 12,
    selectorDefault: 'local',
    categoriasPrioritarias: ['narrativa', 'color', 'texto', 'transicion'],
    necesidadesVisuales: ['narrativa_visual', 'claridad_visual'],
    efectosBase: ['color_cine_contraste', 'vineta_suave', 'micro_movimiento'],
    efectosPrioritarios: ['frase_destacada', 'bloque_contexto', 'fade_in', 'fade_out'],
    efectosBloqueados: ['color_anime_vivo', 'flash_suave'],
    guia: 'Estilo narrativo, histórico, cinematográfico y pausado.'
  },
  'jeff-verso': {
    id: 'jeff-verso',
    nombre: 'Jeff Verso',
    intensidadDefault: 'normal',
    maxEfectosDefault: 12,
    selectorDefault: 'local',
    categoriasPrioritarias: ['texto', 'color', 'movimiento', 'marca'],
    necesidadesVisuales: ['narrativa_visual', 'mantener_retencion'],
    efectosBase: ['tono_calido', 'micro_movimiento', 'nitidez_rostro'],
    efectosPrioritarios: ['frase_destacada', 'palabra_clave', 'cierre_visual_marca'],
    efectosBloqueados: ['borde_deportivo'],
    guia: 'Estilo más personal, expresivo y de cierre emocional.'
  },
  diversos: {
    id: 'diversos',
    nombre: 'Diversos',
    intensidadDefault: 'suave',
    maxEfectosDefault: 8,
    selectorDefault: 'local',
    categoriasPrioritarias: ['movimiento', 'color', 'texto'],
    necesidadesVisuales: ['mantener_retencion'],
    efectosBase: ['micro_movimiento', 'brillo_controlado'],
    efectosPrioritarios: ['titulo_inicial', 'lower_third'],
    efectosBloqueados: [],
    guia: 'Estilo simple para videos variados sin forzar demasiados efectos.'
  }
});

export function obtenerPresetVisualEfectos(perfilId = 'general') {
  const id = String(perfilId || 'general').trim().toLowerCase() || 'general';
  return PRESETS_VISUALES_EFECTOS[id] || PRESETS_VISUALES_EFECTOS.general;
}

export function listarPresetsVisualesEfectos() {
  return Object.values(PRESETS_VISUALES_EFECTOS);
}
