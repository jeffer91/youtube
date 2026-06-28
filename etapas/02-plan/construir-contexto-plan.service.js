/*
  Bloque 2 - Constructor de contexto para Plan
  Función: absorber Entendimiento + Biblioteca general + Biblioteca proyecto antes de crear el Plan o llamar a IA.
*/

import { crearContextoPlanModelo } from './contexto-plan.modelo.js';
import { normalizarContextoPlanParaIA } from './normalizar-contexto-plan.service.js';

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function arr(valor) {
  return Array.isArray(valor) ? valor : [];
}

function tomar(...valores) {
  return valores.find((valor) => valor !== undefined && valor !== null && valor !== '');
}

function obtenerResumen(entendimiento = {}) {
  return entendimiento.resumenEtapa || entendimiento.resumen || entendimiento.reporteEntendimiento?.resumen || {};
}

function obtenerLineaTiempo(entendimiento = {}) {
  return entendimiento.lineaTiempoGlobal || entendimiento.entendimientoGlobal?.lineaTiempoGlobal || entendimiento.lineaTiempo || null;
}

function obtenerResumenLinea(entendimiento = {}) {
  return obtenerLineaTiempo(entendimiento)?.resumen || {};
}

function obtenerTranscripcion(entendimiento = {}) {
  return entendimiento.transcripcionGlobal || entendimiento.transcripcionPrincipal || entendimiento.transcripcion || entendimiento.reporteEntendimiento?.transcripcion || {};
}

function obtenerSegmentos(entendimiento = {}) {
  const transcripcion = obtenerTranscripcion(entendimiento);
  const candidatos = [
    transcripcion.segmentos,
    entendimiento.segmentosGlobales,
    entendimiento.segmentos,
    entendimiento.transcripciones?.segmentos
  ];
  return candidatos.find(Array.isArray) || [];
}

function obtenerTextoTranscripcion(entendimiento = {}) {
  const transcripcion = obtenerTranscripcion(entendimiento);
  return texto(tomar(transcripcion.textoCompleto, transcripcion.texto, transcripcion.transcripcion, entendimiento.textoCompleto), '');
}

function obtenerFrames(entendimiento = {}) {
  const candidatos = [
    entendimiento.framesClave,
    entendimiento.fotogramasClave,
    entendimiento.frames,
    entendimiento.fotogramas,
    entendimiento.analisisVideoGlobal?.framesClave,
    entendimiento.analisisVideoGlobal?.fotogramasClave,
    entendimiento.analisisVideo?.framesClave,
    entendimiento.reporteEntendimiento?.framesClave
  ];
  return candidatos.find(Array.isArray) || [];
}

function obtenerMomentos(entendimiento = {}) {
  const candidatos = [
    entendimiento.analisisVideoGlobal?.momentosClave,
    entendimiento.analisisVideo?.momentosClave,
    entendimiento.momentosClave,
    entendimiento.reporteEntendimiento?.momentosClave,
    entendimiento.resumenEtapa?.momentosClave
  ];
  return candidatos.find(Array.isArray) || [];
}

function obtenerNecesidades(entendimiento = {}) {
  const candidatos = [
    entendimiento.analisisVideoGlobal?.necesidades,
    entendimiento.analisisVideo?.necesidades,
    entendimiento.resumenEtapa?.necesidades,
    entendimiento.reporteEntendimiento?.resumen?.necesidades,
    entendimiento.necesidades
  ];
  return candidatos.find(Array.isArray) || [];
}

function obtenerDuracion(entendimiento = {}) {
  const resumen = obtenerResumen(entendimiento);
  const linea = obtenerResumenLinea(entendimiento);
  return numero(tomar(resumen.duracionTotalSegundos, resumen.duracionSegundos, linea.duracionTotalSegundos, entendimiento.analisis?.duracionTotalSegundos, entendimiento.analisis?.duracionSegundos), 0);
}

function obtenerTotalVideos(entendimiento = {}) {
  const resumen = obtenerResumen(entendimiento);
  const linea = obtenerResumenLinea(entendimiento);
  return numero(tomar(resumen.videosOriginales, resumen.totalVideos, linea.totalVideos, entendimiento.multivideo?.totalVideos, entendimiento.videosEntendimiento?.totalValidos), 1);
}

function normalizarSegmento(segmento = {}, index = 0) {
  return {
    id: segmento.id || `segmento-${index + 1}`,
    videoId: segmento.videoId || null,
    indiceVideo: segmento.indiceVideo ?? segmento.ordenVideo ?? null,
    inicio: numero(tomar(segmento.inicioGlobal, segmento.inicio, segmento.start, segmento.segundo), index * 3),
    fin: numero(tomar(segmento.finGlobal, segmento.fin, segmento.end), (index + 1) * 3),
    texto: texto(segmento.texto || segmento.nota || segmento.frase, `Segmento ${index + 1}`),
    confianza: segmento.confianza ?? segmento.confidence ?? null,
    motor: segmento.motor || segmento.origen || null
  };
}

function normalizarFrame(frame = {}, index = 0) {
  return {
    id: frame.id || frame.frameId || `frame-${index + 1}`,
    videoId: frame.videoId || null,
    segundo: numero(tomar(frame.segundoGlobal, frame.segundo, frame.tiempo, frame.inicio), 0),
    ruta: frame.ruta || frame.path || frame.archivo || '',
    rutaRelativa: frame.rutaRelativa || frame.relativa || '',
    descripcion: texto(frame.descripcion || frame.motivo || frame.nombre || frame.etiqueta, `Frame ${index + 1}`),
    tipo: frame.tipo || frame.categoria || 'frame-clave'
  };
}

function normalizarMomento(momento = {}, index = 0) {
  return {
    id: momento.id || `momento-${index + 1}`,
    videoId: momento.videoId || null,
    tipo: momento.tipo || 'momento',
    inicio: numero(tomar(momento.inicioGlobal, momento.inicio, momento.start, momento.segundo), 0),
    fin: numero(tomar(momento.finGlobal, momento.fin, momento.end), numero(tomar(momento.inicioGlobal, momento.inicio, momento.segundo), 0) + 2),
    prioridad: momento.prioridad ?? index + 1,
    motivo: texto(momento.motivo || momento.descripcion || momento.texto, 'Momento clave detectado.'),
    accionSugerida: momento.accionSugerida || momento.tipoEdicion || null
  };
}

function normalizarNecesidad(necesidad = {}, index = 0) {
  if (typeof necesidad === 'string') return necesidad;
  return {
    id: necesidad.id || `necesidad-${index + 1}`,
    nombre: texto(necesidad.nombre || necesidad.tipo || necesidad.tipoEdicion, `Necesidad ${index + 1}`),
    descripcion: texto(necesidad.descripcion || necesidad.detalle || necesidad.motivo, ''),
    prioridad: necesidad.prioridad ?? index + 1
  };
}

function crearResumenBiblioteca(biblioteca = {}) {
  const resumen = biblioteca.resumen || {};
  return {
    regla: biblioteca.regla || 'La biblioteca se referencia sin copiar archivos.',
    resumen,
    general: {
      disponibles: resumen.totalGeneral || 0,
      seleccionados: resumen.seleccionadosGeneral || 0
    },
    proyecto: {
      disponibles: resumen.totalProyecto || 0,
      seleccionados: resumen.seleccionadosProyecto || 0
    },
    totalDisponibles: resumen.totalDisponibles || 0,
    recursosDisponibles: arr(biblioteca.recursosDisponibles).slice(0, 80)
  };
}

export function construirContextoPlan({ proyectoId, proyecto = {}, estado = {}, entendimiento = {}, biblioteca = {}, solicitud = {} } = {}) {
  const resumenEntendimiento = obtenerResumen(entendimiento);
  const lineaTiempoGlobal = obtenerLineaTiempo(entendimiento);
  const transcripcionBase = obtenerTranscripcion(entendimiento);
  const segmentos = obtenerSegmentos(entendimiento).map(normalizarSegmento);
  const frames = obtenerFrames(entendimiento).map(normalizarFrame);
  const momentosClave = obtenerMomentos(entendimiento).map(normalizarMomento);
  const necesidades = obtenerNecesidades(entendimiento).map(normalizarNecesidad);
  const textoCompleto = obtenerTextoTranscripcion(entendimiento);
  const duracionSegundos = obtenerDuracion(entendimiento);
  const totalVideos = obtenerTotalVideos(entendimiento);
  const bibliotecaContexto = crearResumenBiblioteca(biblioteca);
  const recursosPlan = arr(biblioteca.recursosPlan);

  const proyectoContexto = {
    id: proyectoId || proyecto.id || proyecto.proyectoId,
    nombre: texto(proyecto.nombre || estado.nombre, 'Proyecto AutoVideoJeff'),
    perfil: texto(proyecto.perfil || estado.datos?.perfil || solicitud.perfil, 'general'),
    modoEdicion: texto(proyecto.modoEdicion || estado.datos?.modoEdicion || solicitud.modoEdicion, 'revision_completa'),
    plataforma: texto(proyecto.plataforma || estado.datos?.plataforma || solicitud.plataforma, 'tiktok'),
    totalVideos,
    esMultivideo: totalVideos > 1 || Boolean(entendimiento.multivideo?.activo || resumenEntendimiento.esMultivideo)
  };

  const resumen = {
    totalPartes: 11,
    duracionSegundos,
    totalVideos,
    esMultivideo: proyectoContexto.esMultivideo,
    tieneTranscripcion: Boolean(textoCompleto),
    caracteresTranscripcion: textoCompleto.length,
    segmentosTranscripcion: segmentos.length,
    framesClave: frames.length,
    momentosClave: momentosClave.length,
    necesidades: necesidades.length,
    recursosBibliotecaDisponibles: bibliotecaContexto.totalDisponibles,
    recursosBibliotecaGeneral: bibliotecaContexto.general.seleccionados,
    recursosBibliotecaProyecto: bibliotecaContexto.proyecto.seleccionados,
    recursosPlan: recursosPlan.length,
    listoParaIA: Boolean(textoCompleto || segmentos.length || momentosClave.length || frames.length)
  };

  const contextoParcial = crearContextoPlanModelo({
    proyectoId: proyectoContexto.id,
    proyecto: proyectoContexto,
    resumen,
    entendimiento: {
      resumen: resumenEntendimiento,
      lineaTiempoGlobal,
      analisisGlobal: entendimiento.analisisVideoGlobal || entendimiento.analisisVideo || {},
      multivideo: entendimiento.multivideo || null
    },
    transcripcion: {
      motor: transcripcionBase.motor || transcripcionBase.origen || transcripcionBase.proveedor || 'desconocido',
      idioma: transcripcionBase.idioma || transcripcionBase.language || 'desconocido',
      textoCompleto,
      textoDisponible: Boolean(textoCompleto)
    },
    segmentos,
    frames,
    momentosClave,
    necesidades,
    biblioteca: bibliotecaContexto,
    recursosPlan,
    solicitud
  });

  const contextoIA = normalizarContextoPlanParaIA(contextoParcial);
  return {
    ...contextoParcial,
    contextoIA,
    resumen: {
      ...resumen,
      listoParaIA: contextoIA.listoParaIA
    }
  };
}

export default construirContextoPlan;
