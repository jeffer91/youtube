import { procesarEntrada } from '../entrada/entrada.conexion.js';
import { entenderVideo } from '../entender/entender.conexion.js';
import { mejorarAudioVideo } from '../audio/audio.conexion.js';
import { procesarTranscripcion } from '../transcripcion/transcripcion.conexion.js';
import { procesarInteligenciaCreativa } from '../inteligencia/inteligencia.conexion.js';
import { procesarBrollSugerido } from '../broll/broll.conexion.js';
import { procesarEdicionDinamica } from '../editar/edicion-dinamica/edicion-dinamica.conexion.js';
import { editarVideo } from '../editar/editar.conexion.js';
import { crearPlanEdicion } from '../plan-edicion/crear-plan-edicion.service.js';
import { crearDraftRevision } from '../revision/crear-draft.service.js';
import { aplicarPerfilVisual } from '../perfiles/perfiles.conexion.js';

const PLATAFORMA_PREDETERMINADA = 'tiktok';
const MODO_VIDEO_PREDETERMINADO = 'cuadrado-centro';
const MODO_AUDIO_PREDETERMINADO = 'limpieza-simple';

function validarResultadoEtapa(nombreEtapa, resultado) {
  if (!resultado || typeof resultado !== 'object') throw new Error(`La etapa ${nombreEtapa} no devolvió un objeto válido.`);
  if (resultado.ok !== true) throw new Error(`La etapa ${nombreEtapa} no terminó correctamente: ${resultado.mensaje || 'sin mensaje de error'}`);
}

function crearRegistroHistorial(etapa, mensaje, datos = {}) {
  return { fecha: new Date().toISOString(), etapa, mensaje, ...datos };
}

function convertirBooleano(valor, valorPorDefecto = true) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }
  return valorPorDefecto;
}

function normalizarTexto(valor, valorPorDefecto) {
  if (typeof valor !== 'string') return valorPorDefecto;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : valorPorDefecto;
}

function normalizarModoVideo(valor) {
  const modo = normalizarTexto(valor, MODO_VIDEO_PREDETERMINADO).toLowerCase();
  if (['cuadrado-centro', 'tiktok-cuadrado-centro', 'square-center'].includes(modo)) return 'cuadrado-centro';
  if (['simple', 'tiktok-simple'].includes(modo)) return 'simple';
  return modo;
}

function normalizarOpciones(opciones = {}) {
  return {
    ...opciones,
    plataforma: normalizarTexto(opciones?.plataforma, PLATAFORMA_PREDETERMINADA).toLowerCase(),
    modo: normalizarModoVideo(opciones?.modo),
    mejorarAudio: convertirBooleano(opciones?.mejorarAudio, true),
    modoAudio: normalizarTexto(opciones?.modoAudio, MODO_AUDIO_PREDETERMINADO).toLowerCase(),
    crearTranscripcion: convertirBooleano(opciones?.crearTranscripcion, true),
    agregarSubtitulos: convertirBooleano(opciones?.agregarSubtitulos, true),
    agregarTextosFlotantes: convertirBooleano(opciones?.agregarTextosFlotantes, true),
    usarGemini: convertirBooleano(opciones?.usarGemini, false),
    inteligenciaCreativa: convertirBooleano(opciones?.inteligenciaCreativa, true),
    brollActivo: convertirBooleano(opciones?.brollActivo ?? opciones?.usarBroll ?? opciones?.agregarBroll, true),
    maxBroll: opciones?.maxBroll ?? opciones?.maxSugerenciasBroll ?? 8,
    edicionDinamica: convertirBooleano(opciones?.edicionDinamica ?? opciones?.activarEdicionDinamica ?? opciones?.usarEdicionDinamica, true),
    activarEdicionDinamica: true,
    usarEdicionDinamica: true,
    cortarSilencios: convertirBooleano(opciones?.cortarSilencios, true),
    modoSeguroEdicionDinamica: convertirBooleano(opciones?.modoSeguroEdicionDinamica, true),
    intensidadEdicion: normalizarTexto(opciones?.intensidadEdicion || opciones?.modoEdicionDinamica, 'automatica'),
    modoEdicionDinamica: normalizarTexto(opciones?.modoEdicionDinamica || opciones?.intensidadEdicion, 'automatica'),
    agregarEfectosVisualesDinamicos: convertirBooleano(opciones?.agregarEfectosVisualesDinamicos, true),
    agregarZooms: convertirBooleano(opciones?.agregarZooms, true),
    agregarPunchIn: convertirBooleano(opciones?.agregarPunchIn, true),
    agregarBarraProgreso: convertirBooleano(opciones?.agregarBarraProgreso, true),
    agregarEtiquetasVisuales: convertirBooleano(opciones?.agregarEtiquetasVisuales, true),
    agregarSonidosEdicion: convertirBooleano(opciones?.agregarSonidosEdicion, true),
    modoSonidosEdicion: normalizarTexto(opciones?.modoSonidosEdicion, 'normal'),
    volumenSonidosEdicion: opciones?.volumenSonidosEdicion ?? 0.24,
    separacionMinimaSonidos: opciones?.separacionMinimaSonidos ?? 1.2,
    cantidadMaximaSonidos: opciones?.cantidadMaximaSonidos ?? 16,
    perfilVisual: normalizarTexto(opciones?.perfilVisual || opciones?.perfil, 'educacion'),
    requiereRevision: convertirBooleano(opciones?.requiereRevision ?? opciones?.draftMode, true),
    renderAutomatico: false
  };
}

async function reportarProgreso(progreso, evento) {
  if (typeof progreso !== 'function') return null;
  try { return await progreso(evento); } catch (error) { console.warn('[progreso] No se pudo reportar evento:', error.message); return null; }
}

export async function ejecutarFlujoPlanRevision(solicitud) {
  const opcionesBase = normalizarOpciones(solicitud?.opciones || {});
  const opciones = aplicarPerfilVisual(opcionesBase);
  const historial = [];
  const progreso = solicitud?.progreso || null;
  let etapaActual = 'inicio';

  try {
    await reportarProgreso(progreso, { etapa: 'inicio', porcentaje: 3, titulo: 'Preparando draft', detalle: 'Solicitud recibida para crear plan de edición.' });
    historial.push(crearRegistroHistorial('inicio', 'Solicitud recibida para crear plan de edición.', { nombreOriginal: solicitud.nombreOriginal, plataforma: opciones.plataforma, modo: opciones.modo, perfilVisual: opciones.perfilAplicado?.nombre || opciones.perfilVisual }));
    historial.push(crearRegistroHistorial('perfil', `Perfil visual aplicado: ${opciones.perfilAplicado?.nombre || opciones.perfilVisual}.`, { perfilVisual: opciones.perfilVisual, ritmo: opciones.perfilAplicado?.ritmo || null, estiloSubtitulos: opciones.estiloSubtitulos, estiloTextosFlotantes: opciones.estiloTextosFlotantes }));

    etapaActual = 'entrada';
    await reportarProgreso(progreso, { etapa: 'entrada', porcentaje: 10, titulo: 'Copiando video', detalle: 'Guardando video dentro del proyecto.' });
    const entrada = await procesarEntrada({ archivoTemporal: solicitud.archivoTemporal, nombreOriginal: solicitud.nombreOriginal, nombreTemporal: solicitud.nombreTemporal || null, opciones });
    validarResultadoEtapa('entrada', entrada);
    historial.push(crearRegistroHistorial('entrada', 'Video recibido y copiado correctamente.', { proyectoId: entrada.proyecto?.id || null }));

    etapaActual = 'entender';
    await reportarProgreso(progreso, { etapa: 'entender', porcentaje: 18, titulo: 'Analizando video', detalle: 'Leyendo duración, orientación, resolución y audio.' });
    const entendimiento = await entenderVideo(entrada);
    validarResultadoEtapa('entender', entendimiento);
    historial.push(crearRegistroHistorial('entender', 'Video analizado correctamente.', { orientacion: entendimiento.analisis?.orientacion || 'desconocida', duracionSegundos: entendimiento.analisis?.duracionSegundos || null }));

    etapaActual = 'audio';
    await reportarProgreso(progreso, { etapa: 'audio', porcentaje: 28, titulo: 'Procesando audio', detalle: 'Preparando audio para edición y transcripción.' });
    const audio = await mejorarAudioVideo({ entrada, entendimiento, opciones });
    validarResultadoEtapa('audio', audio);
    historial.push(crearRegistroHistorial('audio', audio.mensaje || 'Etapa de audio completada.', { tipo: audio.tipo || null, omitido: Boolean(audio.omitido) }));

    etapaActual = 'transcripcion';
    await reportarProgreso(progreso, { etapa: 'transcripcion', porcentaje: 40, titulo: 'Preparando textos', detalle: 'Creando transcripción, subtítulos y textos flotantes.' });
    const transcripcion = await procesarTranscripcion({ entrada, entendimiento, audio, opciones });
    validarResultadoEtapa('transcripcion', transcripcion);
    historial.push(crearRegistroHistorial('transcripcion', transcripcion.mensaje || 'Etapa de transcripción completada.', { segmentos: transcripcion.transcripcion?.cantidadSegmentos || 0, textosFlotantes: transcripcion.textosFlotantes?.cantidad || 0, perfilVisual: opciones.perfilVisual }));

    etapaActual = 'inteligencia';
    await reportarProgreso(progreso, { etapa: 'inteligencia', porcentaje: 52, titulo: 'Generando inteligencia creativa', detalle: 'Creando hook, SEO, puntos importantes y miniatura sugerida.' });
    const inteligencia = await procesarInteligenciaCreativa({ entrada, entendimiento, transcripcion, opciones, guardar: true });
    validarResultadoEtapa('inteligencia', inteligencia);
    historial.push(crearRegistroHistorial('inteligencia', inteligencia.mensaje || 'Inteligencia creativa generada.', { hook: inteligencia.hook?.estado || null, seo: inteligencia.seo?.estado || null, miniatura: inteligencia.miniatura?.estado || null }));

    etapaActual = 'broll';
    await reportarProgreso(progreso, { etapa: 'broll', porcentaje: 55, titulo: 'Sugiriendo B-Roll', detalle: 'Creando escenas de apoyo para revisión manual.' });
    const broll = await procesarBrollSugerido({ entrada, entendimiento, transcripcion, inteligencia, opciones, guardar: true });
    validarResultadoEtapa('broll', broll);
    historial.push(crearRegistroHistorial('broll', broll.mensaje || 'B-Roll sugerido generado.', { estado: broll.estado, total: broll.total || 0, guardado: broll.guardado?.rutaBroll || null }));

    etapaActual = 'edicion-dinamica';
    await reportarProgreso(progreso, { etapa: 'edicion-dinamica', porcentaje: 60, titulo: 'Creando edición dinámica', detalle: 'Detectando pausas, cortes y tiempos ajustados.' });
    const edicionDinamica = await procesarEdicionDinamica({ entrada, entendimiento, audio, transcripcion, opciones, progreso });
    validarResultadoEtapa('edicion-dinamica', edicionDinamica);
    historial.push(crearRegistroHistorial('edicion-dinamica', edicionDinamica.diagnostico?.mensaje || edicionDinamica.motivo || 'Etapa de edición dinámica completada.', { activo: Boolean(edicionDinamica.activo), omitido: Boolean(edicionDinamica.omitido), perfilVisual: opciones.perfilVisual }));

    etapaActual = 'editar';
    await reportarProgreso(progreso, { etapa: 'editar', porcentaje: 76, titulo: 'Creando plan técnico', detalle: 'Preparando filtro, visuales y sonidos sin render final.' });
    const edicion = await editarVideo({ entrada, entendimiento, audio, transcripcion, edicionDinamica, opciones, progreso });
    validarResultadoEtapa('editar', edicion);
    historial.push(crearRegistroHistorial('editar', 'Plan técnico de edición generado correctamente.', { tipo: edicion.tipo || null, modo: edicion.modo || opciones.modo, formato: edicion.salida?.formato || null, perfilVisual: opciones.perfilVisual }));

    etapaActual = 'plan-edicion';
    await reportarProgreso(progreso, { etapa: 'plan-edicion', porcentaje: 92, titulo: 'Creando plan editable', detalle: 'Guardando plan-edicion.json para revisión.' });
    const planResultado = await crearPlanEdicion({ entrada, entendimiento, audio, transcripcion, inteligencia, broll, edicionDinamica, edicion, opciones, guardar: true });
    const plan = planResultado.plan;
    historial.push(crearRegistroHistorial('plan-edicion', 'Plan de edición creado correctamente.', { planId: plan?.id || null, rutaPlan: planResultado.guardado?.rutaPlan || null, perfilVisual: opciones.perfilVisual, inteligencia: inteligencia.estado, broll: broll.estado }));

    etapaActual = 'revision';
    await reportarProgreso(progreso, { etapa: 'revision', porcentaje: 96, titulo: 'Creando Draft Mode', detalle: 'Preparando borrador editable antes del render.' });
    const draftResultado = await crearDraftRevision({ plan, opciones, guardar: true });
    const draft = draftResultado.draft;
    historial.push(crearRegistroHistorial('revision', 'Draft de revisión creado correctamente.', { draftId: draft?.id || null, rutaDraft: draftResultado.guardado?.rutaDraft || null }));

    await reportarProgreso(progreso, { etapa: 'revision', porcentaje: 100, titulo: 'Draft listo', detalle: 'Plan y borrador creados. El render final queda pendiente hasta aprobación.', estado: 'finalizado' });

    return {
      ok: true,
      estado: 'DRAFT_CREADO',
      mensaje: 'Plan de edición y draft creados correctamente. Render final pendiente de aprobación.',
      proyecto: entrada.proyecto,
      video: entrada.video,
      entendimiento,
      audio,
      transcripcion,
      inteligencia,
      broll,
      edicionDinamica,
      edicion,
      plan,
      draft,
      perfilVisual: opciones.perfilAplicado || null,
      guardadoPlan: planResultado.guardado || null,
      guardadoDraft: draftResultado.guardado || null,
      historial
    };
  } catch (error) {
    const mensaje = error?.message || 'Error desconocido creando plan de revisión.';
    error.etapa = error.etapa || etapaActual;
    historial.push(crearRegistroHistorial('error', 'El flujo de plan/revisión se detuvo por un error.', { detalle: mensaje, modo: opciones.modo, etapa: etapaActual }));
    throw new Error(`[flujo-plan-revision:${etapaActual}] ${mensaje}`);
  }
}

export default ejecutarFlujoPlanRevision;
