/*
  Bloque 8 + Biblioteca Bloque 5 + Plan IA Bloque 2: Plan de edición backend
  Función: convertir el entendimiento en plan revisable y construir contexto ordenado para IA con Entendimiento + Biblioteca.
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
import { resolverBibliotecaParaPlan } from '../../biblioteca/resolver-biblioteca-plan.service.js';
import { construirContextoPlan } from './construir-contexto-plan.service.js';

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function redondear(valor, decimales = 2) {
  return Number(numero(valor, 0).toFixed(decimales));
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

function obtenerResumen(entendimiento = {}) {
  return entendimiento.resumenEtapa || entendimiento.resumen || entendimiento.reporteEntendimiento?.resumen || {};
}

function obtenerLineaTiempo(entendimiento = {}) {
  return entendimiento.lineaTiempoGlobal || entendimiento.entendimientoGlobal?.lineaTiempoGlobal || null;
}

function obtenerResumenLinea(entendimiento = {}) {
  return obtenerLineaTiempo(entendimiento)?.resumen || {};
}

function obtenerTotalVideos(entendimiento = {}) {
  const resumen = obtenerResumen(entendimiento);
  const linea = obtenerResumenLinea(entendimiento);
  return numero(resumen.videosOriginales ?? resumen.totalVideos ?? linea.totalVideos ?? entendimiento.multivideo?.totalVideos ?? entendimiento.videosEntendimiento?.totalValidos, 1);
}

function esMultivideo(entendimiento = {}) {
  return obtenerTotalVideos(entendimiento) > 1 || Boolean(entendimiento.multivideo?.activo || obtenerResumen(entendimiento).esMultivideo);
}

function obtenerTranscripcion(entendimiento = {}) {
  return entendimiento.transcripcionGlobal || entendimiento.transcripcionPrincipal || entendimiento.transcripcion || {};
}

function obtenerSegmentos(entendimiento = {}) {
  const transcripcion = obtenerTranscripcion(entendimiento);
  return Array.isArray(transcripcion.segmentos) ? transcripcion.segmentos : [];
}

function obtenerMomentos(entendimiento = {}) {
  const momentos = entendimiento.analisisVideoGlobal?.momentosClave || entendimiento.analisisVideo?.momentosClave;
  return Array.isArray(momentos) ? momentos : [];
}

function obtenerNecesidades(entendimiento = {}) {
  const necesidades = entendimiento.analisisVideoGlobal?.necesidades || entendimiento.analisisVideo?.necesidades || entendimiento.resumenEtapa?.necesidades || entendimiento.reporteEntendimiento?.resumen?.necesidades;
  return Array.isArray(necesidades) ? necesidades : [];
}

function obtenerDuracion(entendimiento = {}) {
  const resumen = obtenerResumen(entendimiento);
  const linea = obtenerResumenLinea(entendimiento);
  return numero(resumen.duracionTotalSegundos || resumen.duracionSegundos || linea.duracionTotalSegundos || entendimiento.analisis?.duracionTotalSegundos || entendimiento.analisis?.duracionSegundos, 0);
}

function inicioGlobal(item = {}, respaldo = 0) {
  return redondear(item.inicioGlobal ?? item.inicio ?? item.start ?? item.segundoGlobal ?? item.segundo ?? respaldo, 2);
}

function finGlobal(item = {}, respaldo = 0) {
  return redondear(item.finGlobal ?? item.fin ?? item.end ?? item.segundoGlobal ?? item.segundo ?? respaldo, 2);
}

function metadatosTiempo(item = {}) {
  return {
    videoId: item.videoId || null,
    indiceVideo: item.indiceVideo ?? null,
    ordenVideo: item.ordenVideo ?? null,
    inicioLocal: item.inicioLocal ?? null,
    finLocal: item.finLocal ?? null,
    inicioGlobal: item.inicioGlobal ?? item.inicio ?? item.start ?? null,
    finGlobal: item.finGlobal ?? item.fin ?? item.end ?? null,
    offsetGlobal: item.offsetGlobal ?? null
  };
}

function crearSubtitulosDesdeTranscripcion(entendimiento = {}) {
  const segmentos = obtenerSegmentos(entendimiento);
  if (segmentos.length) {
    return segmentos.slice(0, 80).map((segmento, index) => ({
      id: `subtitulo-${segmento.videoId ? `${segmento.videoId}-` : ''}${index + 1}`,
      texto: texto(segmento.texto || segmento.nota, `Segmento ${index + 1}`),
      inicio: inicioGlobal(segmento, index * 3),
      fin: finGlobal(segmento, (index + 1) * 3),
      motivo: segmento.videoId ? `Subtítulo global derivado de ${segmento.videoId}.` : 'Subtítulo derivado de la transcripción de entendimiento.',
      tipoPlan: 'subtitulo-global',
      ...metadatosTiempo(segmento)
    }));
  }

  const transcripcion = obtenerTranscripcion(entendimiento);
  const completo = texto(transcripcion.textoCompleto, '');
  if (!completo) return [];
  return [{
    id: 'subtitulo-texto-completo',
    texto: completo.slice(0, 180),
    inicio: 0,
    fin: Math.min(6, obtenerDuracion(entendimiento) || 6),
    motivo: 'Texto completo disponible para subtítulo inicial.',
    tipoPlan: 'subtitulo-global'
  }];
}

function crearTextosDesdeMomentos(entendimiento = {}) {
  return obtenerMomentos(entendimiento).slice(0, 30).map((momento, index) => {
    const tipo = texto(momento.tipo, 'momento');
    const titulo = tipo === 'hook' ? 'GANCHO INICIAL' : tipo === 'cierre' ? 'CIERRE CLAVE' : texto(tipo, 'MOMENTO CLAVE').toUpperCase();
    return {
      id: `texto-${momento.videoId ? `${momento.videoId}-` : ''}momento-${index + 1}`,
      texto: momento.videoId ? `${titulo} · ${momento.videoId}` : titulo,
      inicio: inicioGlobal(momento, 0),
      fin: finGlobal(momento, inicioGlobal(momento, 0) + 2),
      motivo: texto(momento.motivo, 'Momento detectado durante el entendimiento.'),
      prioridad: momento.prioridad ?? index + 1,
      tipoPlan: 'texto-momento-global',
      ...metadatosTiempo(momento)
    };
  });
}

function crearRecursosDesdeNecesidades(entendimiento = {}) {
  return obtenerNecesidades(entendimiento).slice(0, 12).map((necesidad, index) => ({
    id: `recurso-necesidad-${index + 1}`,
    nombre: texto(necesidad, `Necesidad ${index + 1}`),
    descripcion: `Recurso o revisión sugerida: ${texto(necesidad, 'sin detalle')}`,
    inicio: 0,
    fin: Math.min(4 + index, obtenerDuracion(entendimiento) || 8),
    motivo: 'Necesidad detectada en la etapa de entendimiento.',
    tipoPlan: 'recurso-revision'
  }));
}

function crearRecursosDesdeVideos(entendimiento = {}) {
  const linea = obtenerLineaTiempo(entendimiento);
  const items = Array.isArray(linea?.lineaTiempo) ? linea.lineaTiempo : [];
  return items.map((video, index) => ({
    id: `recurso-${video.videoId || `video-${index + 1}`}`,
    nombre: `Revisión de ${video.videoId || `video-${index + 1}`}`,
    descripcion: `${texto(video.nombreOriginal || video.nombreSeguro, 'Video original')} · ${redondear(video.duracionSegundos, 2)}s`,
    inicio: numero(video.inicioGlobal, 0),
    fin: numero(video.finGlobal, numero(video.inicioGlobal, 0) + numero(video.duracionSegundos, 0)),
    motivo: 'Bloque de revisión por video dentro de la línea de tiempo global.',
    tipoPlan: 'bloque-video-global',
    videoId: video.videoId || null,
    indiceVideo: video.indice ?? null,
    ordenVideo: video.orden ?? index + 1,
    inicioGlobal: video.inicioGlobal ?? null,
    finGlobal: video.finGlobal ?? null,
    offsetGlobal: video.offsetGlobal ?? null,
    duracionSegundos: video.duracionSegundos ?? null
  }));
}

function crearVisualDesdeEntendimiento(entendimiento = {}) {
  const momentos = obtenerMomentos(entendimiento);
  return {
    zooms: momentos.filter((m) => ['hook', 'idea', 'fotograma'].includes(m.tipo)).slice(0, 16).map((momento, index) => ({
      id: `zoom-${momento.videoId ? `${momento.videoId}-` : ''}${index + 1}`,
      tipo: momento.tipo === 'hook' ? 'punch_in_hook' : 'zoom_suave',
      nombre: momento.tipo === 'hook' ? 'Punch-in de gancho' : 'Zoom de refuerzo visual',
      inicio: inicioGlobal(momento, 0),
      fin: finGlobal(momento, inicioGlobal(momento, 0) + 2),
      motivo: texto(momento.motivo, 'Refuerzo visual por momento clave.'),
      tipoPlan: 'zoom-global',
      ...metadatosTiempo(momento)
    })),
    efectos: momentos.slice(0, 20).map((momento, index) => ({
      id: `efecto-${momento.videoId ? `${momento.videoId}-` : ''}${index + 1}`,
      tipo: momento.tipo === 'cierre' ? 'cierre_limpio' : 'resaltado_momento',
      nombre: momento.tipo === 'hook' ? 'Efecto de gancho inicial' : 'Efecto de énfasis',
      inicio: inicioGlobal(momento, 0),
      fin: finGlobal(momento, inicioGlobal(momento, 0) + 1.5),
      motivo: texto(momento.motivo, 'Efecto sugerido por análisis editorial.'),
      tipoPlan: 'efecto-global',
      ...metadatosTiempo(momento)
    })),
    animaciones: momentos.filter((m) => ['hook', 'cierre'].includes(m.tipo)).slice(0, 8).map((momento, index) => ({
      id: `animacion-${momento.videoId ? `${momento.videoId}-` : ''}${index + 1}`,
      tipo: momento.tipo === 'hook' ? 'entrada_titulo' : 'salida_cierre',
      nombre: momento.tipo === 'hook' ? 'Animación de título inicial' : 'Animación de cierre',
      inicio: inicioGlobal(momento, 0),
      fin: finGlobal(momento, inicioGlobal(momento, 0) + 2),
      motivo: texto(momento.motivo, 'Animación sugerida por momento clave.'),
      tipoPlan: 'animacion-global',
      ...metadatosTiempo(momento)
    }))
  };
}

function crearAudioDesdeEntendimiento(entendimiento = {}) {
  const linea = obtenerResumenLinea(entendimiento);
  const analisis = entendimiento.analisis || {};
  return {
    id: 'audio-plan-base',
    nombre: esMultivideo(entendimiento) ? 'Plan de audio multivideo' : 'Plan de audio seguro',
    motivo: linea.totalVideos ? `Proyecto con ${linea.videosConAudio || 0}/${linea.totalVideos} video(s) con audio detectado.` : analisis.tieneAudio ? 'Mantener audio y preparar limpieza en producción.' : 'Video sin audio detectado o audio pendiente.',
    tieneAudio: Boolean(linea.tieneAudio || analisis.tieneAudio),
    todosTienenAudio: Boolean(linea.todosTienenAudio),
    requiereRevision: linea.totalVideos ? !linea.todosTienenAudio : !analisis.tieneAudio,
    videosConAudio: linea.videosConAudio || null,
    videosSinAudio: linea.videosSinAudio || null
  };
}

function enriquecerPlanConMultivideo({ planProduccion, entendimiento, proyectoId, duracionSegundos } = {}) {
  const lineaTiempoGlobal = obtenerLineaTiempo(entendimiento);
  const totalVideos = obtenerTotalVideos(entendimiento);
  const activo = esMultivideo(entendimiento);
  const elementos = Array.isArray(planProduccion.elementos) ? planProduccion.elementos : [];
  const elementosEnriquecidos = elementos.map((elemento) => {
    const datos = elemento.datos || {};
    return {
      ...elemento,
      videoId: datos.videoId || null,
      indiceVideo: datos.indiceVideo ?? null,
      ordenVideo: datos.ordenVideo ?? null,
      inicioLocal: datos.inicioLocal ?? null,
      finLocal: datos.finLocal ?? null,
      inicioGlobal: datos.inicioGlobal ?? elemento.inicio ?? null,
      finGlobal: datos.finGlobal ?? elemento.fin ?? null,
      offsetGlobal: datos.offsetGlobal ?? null
    };
  });
  return {
    ...planProduccion,
    proyectoId,
    duracionSegundos,
    elementos: elementosEnriquecidos,
    multivideo: {
      activo,
      fase: 'bloque-6-plan-multivideo',
      totalVideos,
      duracionTotalSegundos: duracionSegundos,
      usaTranscripcionGlobal: Boolean(entendimiento.transcripcionGlobal?.textoCompleto || obtenerTranscripcion(entendimiento)?.tipo === 'transcripcion-global-multivideo'),
      usaTiemposGlobales: true,
      nota: activo ? 'Plan creado sobre la línea de tiempo global del proyecto multivideo.' : 'Plan creado con estructura compatible con multivideo.'
    },
    lineaTiempoGlobal,
    actualizadoEn: new Date().toISOString()
  };
}

async function crearPlanEditorial({ proyectoId, estado = {}, entendimiento = {}, solicitud = {} } = {}) {
  const datosEstado = estado.datos || {};
  const totalVideos = obtenerTotalVideos(entendimiento);
  const proyecto = {
    id: proyectoId,
    nombre: texto(estado.nombre, 'Proyecto AutoVideoJeff'),
    perfil: texto(solicitud.perfil || datosEstado.perfil, 'general'),
    modoEdicion: texto(solicitud.modoEdicion || datosEstado.modoEdicion, 'revision_completa'),
    plataforma: texto(solicitud.plataforma || datosEstado.plataforma, 'tiktok'),
    totalVideos,
    esMultivideo: esMultivideo(entendimiento)
  };
  const duracionSegundos = obtenerDuracion(entendimiento);
  const subtitulos = crearSubtitulosDesdeTranscripcion(entendimiento);
  const textos = crearTextosDesdeMomentos(entendimiento);
  const biblioteca = await resolverBibliotecaParaPlan({ proyectoId, proyecto, entendimiento, limiteSeleccionados: 24 });
  const contextoPlan = construirContextoPlan({ proyectoId, proyecto, estado, entendimiento, biblioteca, solicitud });
  const recursos = [
    ...crearRecursosDesdeVideos(entendimiento),
    ...crearRecursosDesdeNecesidades(entendimiento),
    ...biblioteca.recursosPlan
  ];
  const visual = crearVisualDesdeEntendimiento(entendimiento);
  const audio = crearAudioDesdeEntendimiento(entendimiento);

  const planBase = crearPlanProduccion({ proyecto, recursos, subtitulos, textos, visual, audio, duracionSegundos });
  const planProduccion = enriquecerPlanConMultivideo({ planProduccion: planBase, entendimiento, proyectoId, duracionSegundos });
  const validacion = validarPlanProduccion(planProduccion);

  return {
    ok: validacion.ok,
    etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION,
    proyecto,
    resumen: {
      duracionSegundos,
      duracionTotalSegundos: duracionSegundos,
      totalVideos,
      esMultivideo: proyecto.esMultivideo,
      totalElementos: planProduccion.elementos.length,
      subtitulos: subtitulos.length,
      textos: textos.length,
      recursos: recursos.length,
      recursosBiblioteca: biblioteca.resumen.seleccionados,
      recursosBibliotecaGeneral: biblioteca.resumen.seleccionadosGeneral,
      recursosBibliotecaProyecto: biblioteca.resumen.seleccionadosProyecto,
      recursosBibliotecaDisponibles: biblioteca.resumen.totalDisponibles,
      contextoPartes: contextoPlan.resumen.totalPartes,
      contextoListoParaIA: contextoPlan.resumen.listoParaIA,
      contextoSegmentos: contextoPlan.resumen.segmentosTranscripcion,
      contextoFrames: contextoPlan.resumen.framesClave,
      contextoMomentos: contextoPlan.resumen.momentosClave,
      zooms: visual.zooms.length,
      efectos: visual.efectos.length,
      animaciones: visual.animaciones.length,
      segmentosTranscripcion: obtenerSegmentos(entendimiento).length,
      momentosClave: obtenerMomentos(entendimiento).length,
      listoParaProduccion: validacion.ok && planProduccion.elementos.length > 0
    },
    lectura: crearLecturaPlan({ entendimiento, planProduccion, validacion, biblioteca, contextoPlan }),
    planProduccion,
    biblioteca,
    contextoPlan,
    contextoIA: contextoPlan.contextoIA,
    validacion,
    fuente: {
      etapaOrigen: ETAPAS_AUTOVIDEO.ENTENDIMIENTO,
      tipo: proyecto.esMultivideo ? 'entendimiento-global-multivideo' : 'entendimiento-video-unico',
      tieneTranscripcion: Boolean(obtenerTranscripcion(entendimiento)?.textoCompleto),
      tieneTranscripcionGlobal: Boolean(entendimiento.transcripcionGlobal?.textoCompleto),
      momentosClave: obtenerMomentos(entendimiento).length,
      necesidades: obtenerNecesidades(entendimiento),
      lineaTiempoGlobal: obtenerLineaTiempo(entendimiento),
      biblioteca: {
        regla: biblioteca.regla,
        resumen: biblioteca.resumen
      },
      contextoPlan: contextoPlan.resumen
    },
    multivideo: {
      activo: proyecto.esMultivideo,
      fase: 'bloque-6-plan-multivideo',
      totalVideos,
      duracionTotalSegundos: duracionSegundos,
      usaTiemposGlobales: true,
      usaTranscripcionGlobal: Boolean(entendimiento.transcripcionGlobal?.textoCompleto || obtenerTranscripcion(entendimiento)?.textoCompleto),
      siguiente: 'Producción multivideo usando videoId, tiempos globales y recursos de biblioteca referenciados.'
    },
    creadoEn: new Date().toISOString()
  };
}

function crearLecturaPlan({ entendimiento = {}, planProduccion = {}, validacion = {}, biblioteca = {}, contextoPlan = {} } = {}) {
  const momentos = obtenerMomentos(entendimiento);
  const necesidades = obtenerNecesidades(entendimiento);
  const segmentos = obtenerSegmentos(entendimiento);
  const totalVideos = obtenerTotalVideos(entendimiento);
  const lectura = [];
  lectura.push(`Plan creado con ${planProduccion.elementos?.length || 0} elemento(s) revisables.`);
  if (contextoPlan.resumen) lectura.push(`Contexto absorbido: ${contextoPlan.resumen.segmentosTranscripcion || 0} segmento(s), ${contextoPlan.resumen.framesClave || 0} frame(s), ${contextoPlan.resumen.momentosClave || 0} momento(s), ${contextoPlan.resumen.recursosBibliotecaProyecto || 0} recurso(s) temporales y ${contextoPlan.resumen.recursosBibliotecaGeneral || 0} permanente(s).`);
  if (contextoPlan.resumen?.listoParaIA) lectura.push('Contexto listo para IA: resumen humano + JSON técnico ejecutable.');
  if (totalVideos > 1) lectura.push(`Se usó línea de tiempo global de ${totalVideos} video(s).`);
  if (segmentos.length) lectura.push(`Se generaron subtítulos desde ${segmentos.length} segmento(s) global(es).`);
  if (momentos.length) lectura.push(`Se usaron ${momentos.length} momento(s) clave del entendimiento.`);
  if (necesidades.length) lectura.push(`Hay ${necesidades.length} necesidad(es) a revisar antes de producir.`);
  if (biblioteca.resumen) lectura.push(`Biblioteca conectada: ${biblioteca.resumen.seleccionadosProyecto || 0} recurso(s) temporales del proyecto y ${biblioteca.resumen.seleccionadosGeneral || 0} recurso(s) permanentes generales seleccionados sin copiarlos.`);
  if (!obtenerTranscripcion(entendimiento)?.textoCompleto) lectura.push('La transcripción real sigue pendiente; los textos se generaron de forma conservadora.');
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
      mensaje: 'Iniciando plan de edición desde entendimiento global, biblioteca y contexto IA.'
    });

    const entendimientoGuardado = await cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO, valorPorDefecto: null });
    if (!entendimientoGuardado) throw new Error('No se puede crear el plan porque no existe entendimiento guardado. Ejecuta primero la etapa Entendimiento.');
    const estadoProcesando = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
    const entendimiento = extraerEntendimiento(entendimientoGuardado);
    const plan = await crearPlanEditorial({ proyectoId, estado: estadoProcesando, entendimiento, solicitud: { ...opciones, ...solicitud } });

    if (!plan.validacion.ok) {
      throw new Error(`El plan de edición no pasó validación: ${(plan.validacion.errores || []).join(', ')}`);
    }

    const guardado = await guardarResultadoEtapa({
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION,
      resultado: plan,
      metadata: {
        bloque: 8,
        bloqueBiblioteca: 5,
        bloqueContextoPlan: 2,
        tipo: plan.multivideo?.activo ? 'plan-edicion-backend-multivideo-biblioteca-contexto' : 'plan-edicion-backend-biblioteca-contexto',
        origen: 'POST /api/proyectos/:proyectoId/plan/procesar',
        multivideo: plan.multivideo || null,
        biblioteca: plan.biblioteca?.resumen || null,
        contextoPlan: plan.contextoPlan?.resumen || null
      }
    });

    const estadoFinal = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.PLAN_EDICION,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.PLANIFICADO,
      archivoGenerado: guardado.ruta,
      mensaje: plan.multivideo?.activo ? 'Plan de edición multivideo creado con biblioteca y contexto IA.' : 'Plan de edición creado con biblioteca y contexto IA.'
    });

    return {
      ok: true,
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION,
      estado: estadoFinal,
      resultado: plan,
      resumen: plan.resumen,
      biblioteca: plan.biblioteca,
      contextoPlan: plan.contextoPlan,
      contextoIA: plan.contextoIA,
      archivo: guardado,
      mensaje: plan.multivideo?.activo ? 'Plan de edición multivideo creado correctamente con biblioteca y contexto IA.' : 'Plan de edición creado correctamente con biblioteca y contexto IA.'
    };
  } catch (error) {
    await marcarErrorEstadoProyectoEtapas({ proyectoId, etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION, error, mensaje: 'Error creando plan de edición.' }).catch(() => null);
    throw error;
  }
}
