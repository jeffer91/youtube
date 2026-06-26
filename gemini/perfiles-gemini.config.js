/*
  Bloque 18
  Funcion: instrucciones Gemini por perfil de edicion.
*/

export const GEMINI_INSTRUCCIONES_PERFIL = Object.freeze({
  '11-contra-11': Object.freeze({
    tono: 'futbolero, intenso y emocional',
    prioridad: 'jugadas, estadios, hinchada, marcadores y datos deportivos',
    evitar: 'recursos lentos, textos largos o elementos que tapen el rostro'
  }),
  'jeff-isekai': Object.freeze({
    tono: 'anime, expresivo y energetico',
    prioridad: 'fondos anime, impactos visuales, emociones y comparaciones fantasticas',
    evitar: 'saturar la pantalla o perder claridad narrativa'
  }),
  creciaula: Object.freeze({
    tono: 'educativo, claro y ordenado',
    prioridad: 'conceptos, pasos, graficos, iconos y tablas simples',
    evitar: 'efectos innecesarios que distraigan del aprendizaje'
  }),
  general: Object.freeze({
    tono: 'claro, moderno y equilibrado',
    prioridad: 'ideas principales, textos cortos y apoyos visuales utiles',
    evitar: 'exceso de recursos sin relacion con el mensaje'
  }),
  institucional: Object.freeze({
    tono: 'formal, sobrio y profesional',
    prioridad: 'claridad, estructura, datos institucionales y visual limpio',
    evitar: 'humor exagerado, efectos intensos o lenguaje informal'
  }),
  'el-don-historia': Object.freeze({
    tono: 'narrativo, contextual y cronologico',
    prioridad: 'mapas, fechas, personajes, lineas de tiempo y contexto historico',
    evitar: 'anacronismos visuales o recursos sin fuente clara'
  }),
  'jeff-verso': Object.freeze({
    tono: 'cinematografico, elegante y analitico',
    prioridad: 'planos, referencias visuales, comparativas y textos finos',
    evitar: 'efectos que rompan el tono cinematografico'
  })
});

export function obtenerInstruccionesPerfilGemini(perfil = 'general') {
  return GEMINI_INSTRUCCIONES_PERFIL[perfil] || GEMINI_INSTRUCCIONES_PERFIL.general;
}

export function construirBloquePerfilGemini(perfil = {}) {
  const id = perfil.id || perfil || 'general';
  const base = obtenerInstruccionesPerfilGemini(id);
  return [
    `Perfil: ${perfil.nombre || id}`,
    `Tono: ${base.tono}`,
    `Prioridad: ${base.prioridad}`,
    `Evitar: ${base.evitar}`,
    perfil.instruccionesGemini ? `Instrucciones propias: ${perfil.instruccionesGemini}` : ''
  ].filter(Boolean).join('\n');
}
