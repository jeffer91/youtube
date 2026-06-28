/*
  Bloque 2 - Normalizador de contexto para Plan
  Función: convertir el contexto completo en un paquete compacto y ordenado para IA.
*/

import { SALIDA_PLAN_IA } from './contexto-plan.modelo.js';

function texto(valor = '', max = 1200) {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  if (!limpio) return '';
  return limpio.length > max ? `${limpio.slice(0, max)}...` : limpio;
}

function limitarLista(lista = [], limite = 20) {
  return Array.isArray(lista) ? lista.slice(0, limite) : [];
}

function resumenRecurso(recurso = {}) {
  const biblioteca = recurso.biblioteca || recurso;
  return {
    id: recurso.id || biblioteca.id || null,
    nombre: texto(recurso.nombre || biblioteca.nombre || 'Recurso', 160),
    origen: biblioteca.origen || biblioteca.alcance || recurso.alcanceBiblioteca || 'general',
    tipo: recurso.tipo || biblioteca.tipo || 'recurso',
    categoria: recurso.categoria || biblioteca.categoria || 'otro',
    uso: texto(recurso.tipoEdicion || recurso.usoSugerido || recurso.motivo || '', 220),
    ruta: biblioteca.rutaRelativa || biblioteca.ruta || recurso.rutaRelativa || recurso.ruta || ''
  };
}

function crearPromptBase(contexto = {}, compacto = {}) {
  const proyecto = contexto.proyecto || {};
  const resumen = contexto.resumen || {};
  return [
    'Actúa como editor profesional de video para AutoVideoJeff.',
    'Debes crear un plan de edición ejecutable por la app, no solo una explicación.',
    `Proyecto: ${proyecto.nombre || proyecto.id || contexto.proyectoId || 'sin nombre'}.`,
    `Perfil/estilo: ${proyecto.perfil || 'general'}. Plataforma: ${proyecto.plataforma || 'tiktok'}.`,
    `Duración: ${resumen.duracionSegundos || 0}s. Videos: ${resumen.totalVideos || 1}.`,
    `Transcripción: ${resumen.segmentosTranscripcion || 0} segmento(s). Frames: ${resumen.framesClave || 0}. Momentos clave: ${resumen.momentosClave || 0}.`,
    `Biblioteca: ${resumen.recursosBibliotecaProyecto || 0} temporales del proyecto y ${resumen.recursosBibliotecaGeneral || 0} generales permanentes.`,
    'Usa recursos de biblioteca por referencia, sin copiar rutas ni inventar archivos.',
    'Entrega dos opciones de plan: una opción principal y una alternativa local/segura.',
    'La app elegirá automáticamente la mejor, por eso cada opción debe incluir validación.',
    'Devuelve resumen humano y JSON técnico ejecutable por Producción.',
    `Formato esperado: ${JSON.stringify(SALIDA_PLAN_IA.formatoTecnico)}`,
    `Contexto compacto disponible: ${JSON.stringify(compacto).slice(0, 6000)}`
  ].join('\n');
}

export function normalizarContextoPlanParaIA(contexto = {}, opciones = {}) {
  const limites = {
    segmentos: opciones.segmentos ?? 60,
    frames: opciones.frames ?? 36,
    momentos: opciones.momentos ?? 40,
    recursos: opciones.recursos ?? 30,
    textoTranscripcion: opciones.textoTranscripcion ?? 18000
  };

  const compacto = {
    proyecto: contexto.proyecto || {},
    resumen: contexto.resumen || {},
    transcripcion: {
      motor: contexto.transcripcion?.motor || contexto.transcripcion?.origen || 'desconocido',
      idioma: contexto.transcripcion?.idioma || 'desconocido',
      textoCompleto: texto(contexto.transcripcion?.textoCompleto || '', limites.textoTranscripcion)
    },
    segmentos: limitarLista(contexto.segmentos, limites.segmentos).map((segmento, index) => ({
      id: segmento.id || `seg-${index + 1}`,
      inicio: segmento.inicio,
      fin: segmento.fin,
      videoId: segmento.videoId || null,
      texto: texto(segmento.texto || segmento.nota || '', 320)
    })),
    frames: limitarLista(contexto.frames, limites.frames).map((frame, index) => ({
      id: frame.id || `frame-${index + 1}`,
      segundo: frame.segundo ?? frame.inicio ?? frame.tiempo ?? null,
      videoId: frame.videoId || null,
      descripcion: texto(frame.descripcion || frame.motivo || frame.nombre || '', 220),
      ruta: frame.rutaRelativa || frame.ruta || frame.path || ''
    })),
    momentosClave: limitarLista(contexto.momentosClave, limites.momentos).map((momento, index) => ({
      id: momento.id || `momento-${index + 1}`,
      tipo: momento.tipo || 'momento',
      inicio: momento.inicio ?? momento.inicioGlobal ?? momento.segundo ?? null,
      fin: momento.fin ?? momento.finGlobal ?? null,
      videoId: momento.videoId || null,
      motivo: texto(momento.motivo || momento.descripcion || momento.texto || '', 260)
    })),
    necesidades: limitarLista(contexto.necesidades, 30).map((item) => texto(typeof item === 'string' ? item : item.nombre || item.descripcion || item.tipoEdicion || '', 180)).filter(Boolean),
    biblioteca: {
      regla: contexto.biblioteca?.regla || 'Referenciar sin copiar.',
      resumen: contexto.biblioteca?.resumen || {},
      recursosPlan: limitarLista(contexto.recursosPlan, limites.recursos).map(resumenRecurso)
    },
    salidaEsperada: contexto.salidaEsperada || SALIDA_PLAN_IA
  };

  return {
    ok: true,
    tipo: 'contexto-plan-ia-normalizado',
    listoParaIA: true,
    compacto,
    promptBase: crearPromptBase(contexto, compacto),
    checklistValidacion: [
      'Debe existir resumen humano.',
      'Debe existir JSON técnico.',
      'Cada timeline item debe tener inicio y fin.',
      'Cada recurso de biblioteca debe referenciar origen general/proyecto.',
      'Debe respetar transcripción, frames, momentos clave y necesidades.',
      'Debe ser compatible con Producción.'
    ],
    creadoEn: new Date().toISOString()
  };
}
