/*
  Bloque 8: Plan de edición backend
  Función: convertir el entendimiento del video en un plan revisable antes de producir.
*/

import {
  ETAPAS_AUTOVIDEO,
  ESTADOS_PROYECTO_ETAPAS,
  cargarEstadoProyectoEtapas,
  avanzarEstadoProyectoEtapas,
  marcarErrorEstadoProyectoEtapas,
  guardarResultadoEtapa,
  cargarResultadoEtapa
} from '../../flujo-etapas/flujo-etapas.conexion.js';
import { crearPlanProduccion, validarPlanProduccion } from '../../produccion/produccion.conexion.js';

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function extraerResultadoEtapa(wrapper = {}) {
  if (wrapper?.resultado?.resultado) return wrapper.resultado.resultado;
  if (wrapper?.datos?.resultado?.resultado) return wrapper.datos.resultado.resultado;
  if (wrapper?.resultado) return wrapper.resultado;
  return wrapper;
}

function extraerEntendimiento(wrapper = {}) {
  const base = extraerResultadoEtapa(wrapper);
  if (!base || typeof base !== 'object') throw new Error('No existe resultado de entendimiento válido para crear el plan.');
  return base;
}

function obtenerMomentos(entendimiento = {}) {
  const momentos = entendimiento.analisisVideo?.momentosClave;
  return Array.isArray(momentos) ? momentos : [];
}

function obtenerNecesidades(entendimiento = {}) {
  const necesidades = entendimiento.analisisVideo?.necesidades || entendimiento.resumenEtapa?.necesidades || entendimiento.reporteEntendimiento?.resumen?.necesidades;
  return Array.isArray(necesidades) ? necesidades : [];
}

function crearSubtitulosDesdeTranscripcion(entendimiento = {}) {
  const segmentos = Array.isArray(entendimiento.transcripcion?.segmentos) ? entendimiento.transcripcion.segmentos : [];
  if (segmentos.length) {
    return segmentos.slice(0, 18).map((segmento, index) => ({
      id: `subtitulo-${index + 1}`,
      texto: texto(segmento.texto || segmento.nota, `Segmento ${index + 1}`),
      inicio: numero(segmento.inicio ?? segmento.start, index * 3),
      fin: numero(segmento.fin ?? segmento.end, (index + 1) * 3),
      motivo: 'Subtítulo derivado de la transcripción de entendimiento.'
    }));
  }

  const completo = texto(entendimiento.transcripcion?.textoCompleto, '');
  if (!completo) return [];
  return [{ id: 'subtitulo-texto-completo', texto: completo.slice(0, 180), inicio: 0, fin: Math.min(6, numero(entendimiento.analisis?.duracionSegundos, 6)), motivo: 'Texto completo disponible para subtítulo inicial.' }];
}

function crearTextosDesdeMomentos(entendimiento = {}) {
  return obtenerMomentos(entendimiento).slice(0, 10).map((momento, index) => ({
    id: `texto-momento-${index + 1}`,
    texto: momento.tipo === 'hook' ? 'GANCHO INICIAL' : momento.tipo === 'cierre' ? 'CIERRE CLAVE' : texto(momento.tipo, 'MOMENTO CLAVE').toUpperCase(),
    inicio: numero(momento.inicio, 0),
    fin: numero(momento.fin, numero(momento.inicio, 0) + 2),
    motivo: texto(momento.motivo, 'Momento detectado durante el entendimiento.'),
    prioridad: momento.prioridad ?? index + 1
  }));
}

function crearRecursosDesdeNecesidades(entendimiento = {}) {
  return obtenerNecesidades(entendimiento).slice(0, 8).map((necesidad, index) => ({
    id: `recurso-necesidad-${index + 1}`,
    nombre: texto(necesidad, `Necesidad ${index + 1}`),
    descripcion: `Recurso o revisión sugerida: ${texto(necesidad, 'sin detalle')}`,
    inicio: 0,
    fin: Math.min(4 + index, numero(entendimiento.analisis?.duracionSegundos, 8)),
    motivo: 'Necesidad detectada en la etapa de entendimiento.'
  }));
}

function crearVisualDesdeEntendimiento(entendimiento = {}) {
  const momentos = obtenerMomentos(entendimiento);
  return {
    zooms: momentos.filter((m) => ['hook', 'idea', 'fotograma'].includes(m.tipo)).slice(0, 8).map((momento, index) => ({
      id: `zoom-${index + 1}`,
      tipo: momento.tipo === 'hook' ? 'punch_in_hook' : 'zoom_suave',
      nombre: momento.tipo === 'hook' ? 'Punch-in de gancho' : 'Zoom de refuerzo visual',
      inicio: numero(momento.inicio, 0),
      fin: numero(momento.fin, numero(momento.inicio, 0) + 2),
      motivo: texto(momento.motivo, 'Refuerzo visual por momento clave.')
    })),
    efectos: momentos.slice(0, 8).map((momento, index) => ({
      id: `efecto-${index + 1}`,
      tipo: momento.tipo === 'cierre' ? 'cierre_limpio' : 'resaltado_momento',
      nombre: momento.tipo === 'hook' ? 'Efecto de gancho inicial' : 'Efecto de énfasis',
      inicio: numero(momento.inicio, 0),
      fin: numero(momento.fin, numero(momento.inicio, 0) + 1.5),
      motivo: texto(momento.motivo, 'Efecto sugerido por análisis editorial.')
    })),
    animaciones: momentos.filter((m) => ['hook', 'cierre'].includes(m.tipo)).slice(0, 4).map((momento, index) => ({
      id: `animacion-${index + 1}`,
      tipo: momento.tipo === 'hook' ? 'entrada_titulo' : 'salida_cierre',
      nombre: momento.tipo === 'hook' ? 'Animación de título inicial' : 'Animación de cierre',
      inicio: numero(momento.inicio, 0),
      fin: numero(momento.fin, numero(momento.inicio, 0) + 2),
      motivo: texto(momento.motivo, 'Animación sugerida por momento clave.')
    }))
  };
}

function crearPlanEditorial({ proyectoId, estado = {}, entendimiento = {}, solicitud = {} } = {}) {
  const datosEstado = estado.datos || {};
  const proyecto = {
    id: proyectoId,
    nombre: texto(estado.nombre, 'Proyecto AutoVideoJeff'),
    perfil: texto(solicitud.perfil || datosEstado.perfil, 'general'),
    modoEdicion: texto(solicitud.modoEdicion || datosEstado.modoEdicion, 'revision_completa'),
    plataforma: texto(solicitud.plataforma || datosEstado.plataforma, 'tiktok')
  };
  const duracionSegundos = numero(entendimiento.resumen?.duracionSegundos || entendimiento.analisis?.duracionSegundos || entendimiento.resumenEtapa?.duracionSegundos, 0);
  const subtitulos = crearSubtitulosDesdeTranscripcion(entendimiento);
  const textos = crearTextosDesdeMomentos(entendimiento);
  const recursos = crearRecursosDesdeNecesidades(entendimiento);
  const visual = crearVisualDesdeEntendimiento(entendimiento);
  const audio = {
    id: 'audio-plan-base',
    nombre: 'Plan de audio seguro',
    motivo: entendimiento.analisis?.tieneAudio ? 'Mantener audio y preparar limpieza en producción.' : 'Video sin audio detectado o audio pendiente.',
    tieneAudio: Boolean(entendimiento.analisis?.tieneAudio),
    requiereRevision: !entendimiento.analisis?.tieneAudio
  };

  const planProduccion = crearPlanProduccion({ proyecto, recursos, subtitulos, textos, visual, audio, duracionSegundos });
  const validacion = validarPlanProduccion(planProduccion);

  return {
    ok: validacion.ok,
    etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION,
    proyecto,
    resumen: {
      duracionSegundos,
      totalElementos: planProduccion.elementos.length,
      subtitulos: subtitulos.length,
      textos: textos.length,
      recursos: recursos.length,
      zooms: visual.zooms.length,
      efectos: visual.efectos.length,
      animaciones: visual.animaciones.length,
      listoParaProduccion: validacion.ok && planProduccion.elementos.length > 0
    },
    lectura: crearLecturaPlan({ entendimiento, planProduccion, validacion }),
    planProduccion,
    validacion,
    fuente: {
      etapaOrigen: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      tieneTranscripcion: Boolean(entendimiento.transcripcion?.textoCompleto),
      momentosClave: obtenerMomentos(entendimiento).length,
      necesidades: obtenerNecesidades(entendimiento)
    },
    creadoEn: new Date().toISOString()
  };
}

function crearLecturaPlan({ entendimiento = {}, planProduccion = {}, validacion = {} } = {}) {
  const momentos = obtenerMomentos(entendimiento);
  const necesidades = obtenerNecesidades(entendimiento);
  const lectura = [];
  lectura.push(`Plan creado con ${planProduccion.elementos?.length || 0} elemento(s) revisables.`);
  if (momentos.length) lectura.push(`Se usaron ${momentos.length} momento(s) clave del entendimiento.`);
  if (necesidades.length) lectura.push(`Hay ${necesidades.length} necesidad(es) a revisar antes de producir.`);
  if (!entendimiento.transcripcion?.textoCompleto) lectura.push('La transcripción real sigue pendiente; los textos se generaron de forma conservadora.');
  if (!validacion.ok) lectura.push(`Validación con errores: ${(validacion.errores || []).join(' | ')}`);
  return lectura;
}

export async function procesarPlanEdicionProyectoEtapa({ proyectoId, opciones = {}, solicitud = {} } = {}) {
  if (!proyectoId) throw new Error('Falta proyectoId para procesar el plan de edición.');
  const estadoInicial = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
  if (!estadoInicial) throw new Error('No existe estado-proyecto.json. Primero crea el proyecto.');

  try {
    await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.PLAN_EDICION,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.PLANIFICANDO,
      mensaje: 'Iniciando plan de edición desde entendimiento.'
    });

    const entendimientoGuardado = await cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO, valorPorDefecto: null });
    if (!entendimientoGuardado) throw new Error('No se puede crear el plan porque no existe entendimiento guardado. Ejecuta primero la etapa Entendimiento.');
    const estadoProcesando = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
    const entendimiento = extraerEntendimiento(entendimientoGuardado);
    const plan = crearPlanEditorial({ proyectoId, estado: estadoProcesando, entendimiento, solicitud: { ...opciones, ...solicitud } });

    if (!plan.validacion.ok) {
      throw new Error(`El plan de edición no pasó validación: ${(plan.validacion.errores || []).join(', ')}`);
    }

    const guardado = await guardarResultadoEtapa({
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION,
      resultado: plan,
      metadata: {
        bloque: 8,
        tipo: 'plan-edicion-backend',
        origen: 'POST /api/proyectos/:proyectoId/plan/procesar'
      }
    });

    const estadoFinal = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.PLAN_EDICION,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.PLANIFICADO,
      archivoGenerado: guardado.ruta,
      mensaje: 'Plan de edición creado desde entendimiento.'
    });

    return {
      ok: true,
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION,
      estado: estadoFinal,
      resultado: plan,
      resumen: plan.resumen,
      archivo: guardado,
      mensaje: 'Plan de edición creado correctamente.'
    };
  } catch (error) {
    await marcarErrorEstadoProyectoEtapas({ proyectoId, etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION, error, mensaje: 'Error creando plan de edición.' }).catch(() => null);
    throw error;
  }
}
