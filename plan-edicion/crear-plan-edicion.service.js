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

function extraerFormatos(config, edicion) {
  const formatoSalida = edicion?.salida?.formato || null;
  const formatos = new Set(config.formatosExportacion || []);
  if (formatoSalida === '9:16') formatos.add('vertical-9-16');
  if (formatoSalida === '16:9') formatos.add('horizontal-16-9');
  if (formatoSalida === '1:1') formatos.add('cuadrado-1-1');
  return [...formatos];
}

function crearResumenHook({ transcripcion, opciones }) {
  const segmentos = extraerSegmentos(transcripcion);
  const primerSegmentoConTexto = segmentos.find((segmento) => String(segmento?.texto || '').trim().length > 0) || null;
  return {
    activo: Boolean(opciones?.hookGenerator || opciones?.usarHookGenerator),
    estado: primerSegmentoConTexto ? 'SUGERIDO_BASE' : 'PENDIENTE_TRANSCRIPCION_REAL',
    inicio: primerSegmentoConTexto?.inicio ?? 0,
    fin: primerSegmentoConTexto?.fin ?? null,
    texto: primerSegmentoConTexto?.texto || '',
    motivo: primerSegmentoConTexto ? 'Hook base tomado del primer segmento con texto. Se reemplazará por inteligencia real en el siguiente bloque.' : 'No hay segmentos con texto para sugerir hook.'
  };
}

function crearRevisionBase({ transcripcion, edicionDinamica, config }) {
  const segmentos = extraerSegmentos(transcripcion);
  const textos = extraerTextosFlotantes(transcripcion).slice(0, config.maxTextosFlotantes);
  const cortes = extraerCortes(edicionDinamica);

  return {
    requiereRevision: config.requiereRevision,
    cortes: cortes.map((corte, index) => ({ id: corte.id || index + 1, activo: true, ...corte })),
    subtitulos: segmentos.map((segmento, index) => ({ id: segmento.id || index + 1, activo: true, inicio: segmento.inicio ?? 0, fin: segmento.fin ?? null, texto: segmento.texto || '' })),
    textosFlotantes: textos.map((texto, index) => ({ id: texto.id || index + 1, activo: true, ...texto })),
    broll: [],
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

export async function crearPlanEdicion({ entrada, entendimiento = null, audio = null, transcripcion = null, edicionDinamica = null, edicion = null, opciones = {}, guardar = true } = {}) {
  if (!entrada?.proyecto?.id) throw new Error('No se puede crear plan de edición sin proyecto de entrada.');

  const config = obtenerConfigPlanEdicion(opciones);
  const idPlan = `plan-${entrada.proyecto.id}-${Date.now().toString(36)}`;
  const hook = crearResumenHook({ transcripcion, opciones });

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
      renderAutomatico: config.renderAutomatico
    },
    decisiones: {
      hook,
      broll: { estado: 'PENDIENTE', items: [], mensaje: 'B-Roll inteligente se conectará en un módulo posterior.' },
      seo: { estado: 'PENDIENTE', archivoSeo: null, mensaje: 'SEO automático se conectará en el módulo inteligencia.' },
      branding: { estado: 'PENDIENTE', logo: null, outro: null, miniatura: null }
    },
    etapas: {
      entrada,
      entendimiento,
      audio,
      transcripcion,
      edicionDinamica,
      edicion
    },
    revision: crearRevisionBase({ transcripcion, edicionDinamica, config }),
    exportacion: crearExportacionBase({ config, edicion }),
    rutas: {
      carpetaProyecto: entrada.rutas?.carpetaProyecto || null,
      rutaVideoOriginal: entrada.video?.rutaOriginal || null
    },
    historial: [crearEventoPlan(EVENTOS_PLAN_EDICION.CREADO, 'Plan de edición creado como borrador.', { perfil: config.perfil, nivelEdicion: config.nivelEdicion })],
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
