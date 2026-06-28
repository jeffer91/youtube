/*
  Bloque 4 - Plan por partes
  Función: definir las secciones que la IA debe entregar y validar progresivamente.
*/

export const PARTES_PLAN_EDICION = Object.freeze([
  {
    id: 'resumenEstrategico',
    orden: 1,
    titulo: 'Resumen estratégico',
    descripcion: 'Explica la intención editorial, objetivo del video, tono y dirección general.',
    requiere: ['proyecto', 'resumen', 'transcripcion'],
    salidaEsperada: ['resumenHumano', 'objetivoEdicion', 'criteriosCalidad']
  },
  {
    id: 'estructuraNarrativa',
    orden: 2,
    titulo: 'Estructura narrativa',
    descripcion: 'Define apertura, desarrollo, puntos de apoyo, clímax y cierre.',
    requiere: ['transcripcion', 'momentosClave', 'necesidades'],
    salidaEsperada: ['bloquesNarrativos', 'gancho', 'cierre']
  },
  {
    id: 'timelineSegundos',
    orden: 3,
    titulo: 'Timeline por segundos',
    descripcion: 'Convierte el análisis en acciones por tiempo para que Producción pueda ejecutarlas.',
    requiere: ['segmentos', 'frames', 'momentosClave'],
    salidaEsperada: ['timeline']
  },
  {
    id: 'textosPantalla',
    orden: 4,
    titulo: 'Textos en pantalla',
    descripcion: 'Propone títulos, rótulos, enfatizadores y textos breves por momento.',
    requiere: ['transcripcion', 'momentosClave', 'perfil'],
    salidaEsperada: ['textosPantalla']
  },
  {
    id: 'subtitulos',
    orden: 5,
    titulo: 'Subtítulos sugeridos',
    descripcion: 'Ordena subtítulos útiles desde la transcripción y evita exceso de texto.',
    requiere: ['segmentos', 'transcripcion'],
    salidaEsperada: ['subtitulos']
  },
  {
    id: 'recursosBiblioteca',
    orden: 6,
    titulo: 'Recursos de biblioteca',
    descripcion: 'Decide cuándo usar recursos generales y temporales sin copiar archivos.',
    requiere: ['bibliotecaGeneral', 'bibliotecaProyecto', 'recursosPlan'],
    salidaEsperada: ['recursosBiblioteca']
  },
  {
    id: 'audioEfectosTransiciones',
    orden: 7,
    titulo: 'Audio, efectos y transiciones',
    descripcion: 'Propone tratamiento de audio, efectos visuales, transiciones y ritmo.',
    requiere: ['momentosClave', 'necesidades', 'biblioteca'],
    salidaEsperada: ['audio', 'efectos', 'transiciones']
  },
  {
    id: 'validacionFinal',
    orden: 8,
    titulo: 'Validación final',
    descripcion: 'Valida compatibilidad, errores, advertencias y preparación para Producción.',
    requiere: ['todasLasPartes'],
    salidaEsperada: ['validacion', 'checklistProduccion']
  }
]);

export function obtenerPartePlan(id) {
  return PARTES_PLAN_EDICION.find((parte) => parte.id === id) || null;
}

export function listarIdsPartesPlan() {
  return PARTES_PLAN_EDICION.map((parte) => parte.id);
}
