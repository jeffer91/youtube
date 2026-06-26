/*
  Modulo: perfiles
  Funcion: perfiles iniciales de edicion definidos por Jeff.
*/

export const PERFILES_EDICION = Object.freeze({
  '11-contra-11': Object.freeze({
    id: '11-contra-11',
    nombre: '11 contra 11',
    categoria: 'futbol',
    descripcion: 'Edicion deportiva, intensa, rapida y emocional para futbol.',
    ritmo: 'alto',
    nivelVisual: 'dinamico',
    musica: 'energia_baja_bajo_voz',
    subtitulos: 'dinamicos_con_contorno',
    recursos: ['jugadas', 'estadios', 'hinchada', 'marcadores', 'graficos_deportivos'],
    instruccionesGemini: 'Analiza el discurso como contenido futbolero. Sugiere recursos deportivos, datos visuales, contexto de partido y frases de impacto sin tapar al sujeto.'
  }),
  'jeff-isekai': Object.freeze({
    id: 'jeff-isekai',
    nombre: 'Jeff Isekai',
    categoria: 'anime',
    descripcion: 'Edicion con energia anime, fondos expresivos, textos llamativos y recursos visuales fantasticos.',
    ritmo: 'alto',
    nivelVisual: 'muy_visual',
    musica: 'anime_suave_bajo_voz',
    subtitulos: 'dinamicos_con_contorno',
    recursos: ['fondos_anime', 'energia', 'impactos', 'transiciones', 'elementos_fantasia'],
    instruccionesGemini: 'Propone recursos inspirados en narrativa anime, emociones fuertes y comparaciones visuales sin volver confuso el mensaje.'
  }),
  creciaula: Object.freeze({
    id: 'creciaula',
    nombre: 'Creciaula',
    categoria: 'educacion',
    descripcion: 'Edicion educativa clara, limpia, con conceptos, graficos y tablas cuando aporten valor.',
    ritmo: 'medio',
    nivelVisual: 'claro',
    musica: 'suave_bajo_voz',
    subtitulos: 'frases_claras_con_contorno',
    recursos: ['aulas', 'diagramas', 'tablas', 'iconos_educativos', 'graficos'],
    instruccionesGemini: 'Extrae ideas pedagogicas, conceptos clave, tablas o graficos simples. Prioriza claridad y no saturar pantalla.'
  }),
  general: Object.freeze({
    id: 'general',
    nombre: 'General',
    categoria: 'general',
    descripcion: 'Edicion equilibrada para cualquier video de Jeff hablando.',
    ritmo: 'medio',
    nivelVisual: 'equilibrado',
    musica: 'suave_bajo_voz',
    subtitulos: 'adaptados_por_plataforma',
    recursos: ['imagenes_contextuales', 'fondos_limpios', 'textos_clave', 'broll_general'],
    instruccionesGemini: 'Detecta ideas principales, sugiere apoyos visuales y mantiene una edicion clara, moderna y sin exceso.'
  }),
  institucional: Object.freeze({
    id: 'institucional',
    nombre: 'Institucional',
    categoria: 'formal',
    descripcion: 'Edicion formal, sobria, limpia y profesional.',
    ritmo: 'bajo_medio',
    nivelVisual: 'limpio',
    musica: 'corporativa_muy_baja',
    subtitulos: 'sobrios_con_contorno',
    recursos: ['fondos_formales', 'iconos_institucionales', 'graficos_limpios', 'titulos_sobrios'],
    instruccionesGemini: 'Mantiene tono formal. Sugiere apoyos visuales profesionales, evita exageraciones y cuida la claridad institucional.'
  }),
  'el-don-historia': Object.freeze({
    id: 'el-don-historia',
    nombre: 'El Don Historia',
    categoria: 'historia',
    descripcion: 'Edicion narrativa para historias, contexto, epica y explicaciones cronologicas.',
    ritmo: 'medio_alto',
    nivelVisual: 'narrativo',
    musica: 'cinematica_baja',
    subtitulos: 'narrativos_con_contorno',
    recursos: ['mapas', 'lineas_de_tiempo', 'fotos_historicas', 'texturas', 'documentos'],
    instruccionesGemini: 'Identifica contexto, fechas, personajes y secuencia. Sugiere mapas, lineas de tiempo y recursos narrativos.'
  }),
  'jeff-verso': Object.freeze({
    id: 'jeff-verso',
    nombre: 'Jeff Verso',
    categoria: 'cine',
    descripcion: 'Edicion cinematografica, visual, con ritmo de analisis de cine e imagen potente.',
    ritmo: 'medio_alto',
    nivelVisual: 'cinematografico',
    musica: 'cinematica_baja',
    subtitulos: 'cinematograficos_con_contorno',
    recursos: ['fotogramas_referenciales', 'luces', 'fondos_cine', 'textos_cinematicos', 'comparativas'],
    instruccionesGemini: 'Sugiere recursos de lenguaje cinematografico, planos, referencias visuales y textos elegantes sin saturar.'
  })
});

export const PERFIL_DEFECTO = 'general';

export function obtenerIdsPerfiles() {
  return Object.keys(PERFILES_EDICION);
}
