import { crearIdProyecto } from '../comun/archivos.js';
import { obtenerConfigPlanEdicion } from './plan-edicion.config.js';
import { ESTADOS_PLAN_EDICION, EVENTOS_PLAN_EDICION, PLAN_EDICION_VERSION, crearEventoPlan } from './estados-plan.js';
import { guardarPlanEdicion } from './guardar-plan-edicion.js';

function extraerSegmentos(transcripcion) {
  if (Array.isArray(transcripcion?.transcripcion?.segmentos)) return transcripcion.transcripcion.segmentos;
  if (Array.isArray(transcripcion?.segmentos)) return transcripcion.segmentos;
  return [];
}

function extraerTextosFlotantes(transcripcion) {
  if (Array.isArray(transcripcion?.textosFlotantes?.textos)) return transcripcion.textosFlotantes.textos;
  if (Array.isArray(transcripcion?.textosFlotantes)) return transcripcion.textosFlotantes;
  return [];
}

function extraerCortes(edicionDinamica) {
  if (Array.isArray(edicionDinamica?.cortes?.planCortes?.cortes)) return edicionDinamica.cortes.planCortes.cortes;
  return [];
}

function extraerBroll(broll) {
  if (Array.isArray(broll?.items)) return broll.items;
  if (Array.isArray(broll)) return broll;
  return [];
}

function extraerFormatos(config, edicion) {
  const formatoSalida = edicion?.salida?.formato || null;
  const formatos = new Set(config.formatosExportacion || []);
  if (formatoSalida === '9:16') formatos.add('vertical-9-16');
  if (formatoSalida === '16:9') formatos.add('horizontal-16-9');
  if (formatoSalida === '1:1') formatos.add('cuadrado-1-1');
  return [...formatos];
}

function crearResumenHook({ transcripcion, opciones, inteligencia }) {
  if (inteligencia?.hook) return inteligencia.hook;
  const segmentos = extraerSegmentos(transcripcion);
  const primerSegmentoConTexto = segmentos.find((segmento) => String(segmento?.texto || '').trim().length > 0) || null;
  return {
    activo: Boolean(opciones?.hookGenerator || opciones?.usarHookGenerator),
    estado: primerSegmentoConTexto ? 'SUGERIDO_BASE' : 'PENDIENTE_TRANSCRIPCION_REAL',
    inicio: primerSegmentoConTexto?.inicio ?? 0,
    fin: primerSegmentoConTexto?.fin ?? null,
    texto: primerSegmentoConTexto?.texto || '',
    motivo: primerSegmentoConTexto ? 'Hook base tomado del primer segmento con texto.' : 'No hay segmentos con texto para sugerir hook.'
  };
}

function crearPerfilPlan(opciones = {}) {
  const perfil = opciones.perfilAplicado || null;
  if (!perfil) {
    return {
      estado: 'NO_APLICADO',
      id: opciones.perfilVisual || opciones.perfil || 'educacion',
      mensaje: 'El perfil visual se registró solo por id; no se recibió configuración completa.'
    };
  }

  return {
    estado: 'APLICADO',
    id: perfil.id,
    nombre: perfil.nombre,
    descripcion: perfil.descripcion,
    ritmo: perfil.ritmo,
    visual: perfil.visual,
    transcripcion: perfil.transcripcion,
    edicion: perfil.edicion,
    sonido: perfil.sonido,
    mensaje: `Perfil visual aplicado: ${perfil.nombre}.`
  };
}

function crearDecisionSeo(inteligencia = null) {
  if (inteligencia?.seo) return inteligencia.seo;
  return { estado: 'PENDIENTE', archivoSeo: null, mensaje: 'SEO automático se conectará en el módulo inteligencia.' };
}

function crearDecisionMiniatura(inteligencia = null) {
  if (inteligencia?.miniatura) return inteligencia.miniatura;
  return null;
}

function crearPuntosImportantes(inteligencia = null) {
  if (inteligencia?.puntosImportantes) return inteligencia.puntosImportantes;
  return { estado: 'PENDIENTE', cantidad: 0, puntos: [] };
}

function crearDecisionBroll(broll = null) {
  if (!broll) {
    return { estado: 'PENDIENTE', items: [], mensaje: 'B-Roll sugerido pendiente.' };
  }

  return {
    estado: broll.estado || 'SUGERIDO_LOCAL',
    tipo: broll.tipo || 'broll-sugerido',
    total: broll.total || extraerBroll(broll).length,
    items: extraerBroll(broll),
    mensaje: broll.mensaje || 'B-Roll sugerido localmente.',
    advertencias: broll.advertencias || [],
    guardado: broll.guardado || null
  };
}

function crearRevisionBase({ transcripcion, edicionDinamica, broll, config }) {
  const segmentos = extraerSegmentos(transcripcion);
  const textos = extraerTextosFlotantes(transcripcion).slice(0, config.maxTextosFlotantes);
  const cortes = extraerCortes(edicionDinamica);
  const brollItems = extraerBroll(broll);

  return {
    requiereRevision: config.requiereRevision,
    cortes: cortes.map((corte, index) => ({ id: corte.id || index + 1, activo: true, ...corte })),
    subtitulos: segmentos.map((segmento, index) => ({ id: segmento.id || index + 1, activo: true, inicio: segmento.inicio ?? 0, fin: segmento.fin ?? null, texto: segmento.texto || '' })),
    textosFlotantes: textos.map((texto, index) => ({ id: texto.id || index + 1, activo: true, ...texto })),
    broll: brollItems.map((item, index) => ({ id: item.id || `broll-${index + 1}`, activo: item.activo !== false, ...item })),
    miniatura: null,
    observaciones: []
  };
}

function crearExportacionBase({ config, edicion }) {
  return {
    formatos: extraerFormatos(config, edicion),
    principal: config.formatoPrincipal,
    renderAutomatico: config.renderAutomatico,
    salidaActual: edicion?.salida || null,
    pendienteRenderFinal: true
  };
}

export async function crearPlanEdicion({ entrada, entendimiento = null, audio = null, transcripcion = null, inteligencia = null, broll = null, edicionDinamica = null, edicion = null, opciones = {}, guardar = true } = {}) {
  if (!entrada?.proyecto?.id) throw new Error('No se puede crear plan de edición sin proyecto de entrada.');

  const config = obtenerConfigPlanEdicion(opciones);
  const idPlan = `plan-${entrada.proyecto.id}-${Date.now().toString(36)}`;
  const hook = crearResumenHook({ transcripcion, opciones, inteligencia });
  const perfilVisual = crearPerfilPlan(opciones);
  const decisionBroll = crearDecisionBroll(broll);

  const plan = {
    ok: true,
    tipo: 'plan-edicion',
    version: PLAN_EDICION_VERSION,
    id: idPlan,
    estado: ESTADOS_PLAN_EDICION.BORRADOR,
    proyecto: {
      id: entrada.proyecto.id,
      nombre: entrada.proyecto.nombre || null,
      plataforma: entrada.proyecto.plataforma || config.plataforma,
      modo: entrada.proyecto.modo || opciones.modo || null
    },
    video: {
      nombreOriginal: entrada.video?.nombreOriginal || null,
      nombreSeguro: entrada.video?.nombreSeguro || null,
      rutaOriginal: entrada.video?.rutaOriginal || null,
      orientacion: entendimiento?.analisis?.orientacion || null,
      duracionSegundos: entendimiento?.analisis?.duracionSegundos || null,
      tieneAudio: Boolean(entendimiento?.analisis?.tieneAudio)
    },
    config: {
      perfil: config.perfil,
      nivelEdicion: config.nivelEdicion,
      plataforma: config.plataforma,
      formatoPrincipal: config.formatoPrincipal,
      formatosExportacion: config.formatosExportacion,
      requiereRevision: config.requiereRevision,
      renderAutomatico: config.renderAutomatico,
      perfilVisualAplicado: perfilVisual.id,
      ritmoPerfil: perfilVisual.ritmo || null
    },
    decisiones: {
      perfilVisual,
      inteligencia: inteligencia ? { estado: inteligencia.estado, mensaje: inteligencia.mensaje, guardado: inteligencia.guardado || null } : { estado: 'NO_GENERADA' },
      hook,
      puntosImportantes: crearPuntosImportantes(inteligencia),
      broll: decisionBroll,
      seo: crearDecisionSeo(inteligencia),
      branding: { estado: 'PENDIENTE', logo: null, outro: null, miniatura: crearDecisionMiniatura(inteligencia) }
    },
    etapas: {
      entrada,
      entendimiento,
      audio,
      transcripcion,
      inteligencia,
      broll,
      edicionDinamica,
      edicion
    },
    revision: crearRevisionBase({ transcripcion, edicionDinamica, broll, config }),
    exportacion: crearExportacionBase({ config, edicion }),
    rutas: {
      carpetaProyecto: entrada.rutas?.carpetaProyecto || null,
      rutaVideoOriginal: entrada.video?.rutaOriginal || null
    },
    historial: [crearEventoPlan(EVENTOS_PLAN_EDICION.CREADO, 'Plan de edición creado como borrador.', { perfil: config.perfil, nivelEdicion: config.nivelEdicion, perfilVisual: perfilVisual.id, inteligencia: inteligencia?.estado || 'NO_GENERADA', broll: decisionBroll.estado, totalBroll: decisionBroll.total || 0 })],
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
    trazabilidad: {
      generadoPor: 'plan-edicion/crear-plan-edicion.service.js',
      jobId: opciones.jobId || null,
      referencia: crearIdProyecto('traza')
    }
  };

  if (!guardar) return { ok: true, plan, guardado: null };
  const guardado = await guardarPlanEdicion({ entrada, plan, opciones });
  return { ok: true, plan: guardado.plan, guardado };
}

export default crearPlanEdicion;
