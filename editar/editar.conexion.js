import fs from 'fs';
import { reportarModulo } from '../progreso/progreso-modulo.js';
import { crearEdicionTikTokSimple } from './tiktok-simple/tiktok.service.js';
import { crearEdicionTikTokCuadradoCentro } from './tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js';
import { procesarEdicionDinamica } from './edicion-dinamica/edicion-dinamica.conexion.js';

const MODOS_TIKTOK = Object.freeze({ SIMPLE: 'simple', CUADRADO_CENTRO: 'cuadrado-centro' });
const PLATAFORMA_PREDETERMINADA = 'tiktok';
const MODO_VIDEO_PREDETERMINADO = MODOS_TIKTOK.CUADRADO_CENTRO;

function validarEntradaParaEditar(entrada) {
  if (!entrada || typeof entrada !== 'object') throw new Error('No se puede editar porque la entrada no es válida.');
  if (!entrada.video?.rutaOriginal) throw new Error('No se puede editar porque falta la ruta del video original.');
  if (!fs.existsSync(entrada.video.rutaOriginal)) throw new Error(`No se puede editar porque no existe el video: ${entrada.video.rutaOriginal}`);
  if (!entrada.proyecto?.id) throw new Error('No se puede editar porque falta el ID del proyecto.');
  if (!entrada.rutas?.carpetaProyecto) throw new Error('No se puede editar porque falta la carpeta del proyecto.');
}

function validarEntendimiento(entendimiento) {
  if (!entendimiento || typeof entendimiento !== 'object') throw new Error('No se puede editar porque falta el entendimiento del video.');
  if (entendimiento.ok !== true) throw new Error('No se puede editar porque el análisis del video no terminó correctamente.');
  if (!entendimiento.analisis || typeof entendimiento.analisis !== 'object') throw new Error('No se puede editar porque falta el análisis técnico del video.');
}

function normalizarTexto(valor, valorPorDefecto) {
  if (typeof valor !== 'string') return valorPorDefecto;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : valorPorDefecto;
}

function arr(valor) {
  return Array.isArray(valor) ? valor : [];
}

function normalizarPlataforma(opciones, entrada) {
  return normalizarTexto(opciones?.plataforma || entrada?.proyecto?.plataforma, PLATAFORMA_PREDETERMINADA).toLowerCase();
}

function normalizarModo(opciones, entrada) {
  const modo = normalizarTexto(opciones?.modo || entrada?.proyecto?.modo, MODO_VIDEO_PREDETERMINADO).toLowerCase();
  if (['cuadrado-centro', 'tiktok-cuadrado-centro', 'square-center'].includes(modo)) return MODOS_TIKTOK.CUADRADO_CENTRO;
  if (['simple', 'tiktok-simple'].includes(modo)) return MODOS_TIKTOK.SIMPLE;
  return modo;
}

function validarModoTikTok(modo) {
  const modosDisponibles = Object.values(MODOS_TIKTOK);
  if (!modosDisponibles.includes(modo)) throw new Error(`Modo de edición TikTok no soportado: ${modo}. Modos disponibles: ${modosDisponibles.join(', ')}`);
}

function contarPlanEdicion(edicionDinamica = null, opciones = {}) {
  return arr(edicionDinamica?.mapaTiempo).length
    + arr(edicionDinamica?.eventosVisualesPlan).length
    + arr(edicionDinamica?.eventosSonidoPlan).length
    + arr(edicionDinamica?.eventosTextoPlan).length
    + arr(edicionDinamica?.puentePlanEdicion?.mapaTiempo).length
    + arr(opciones?.instruccionesEdicionPlan).length;
}

function necesitaEjecutarEdicionDinamicaReal(edicionDinamica = null, opciones = {}) {
  if (opciones?.procesarEdicionDinamicaReal === false) return false;
  if (!edicionDinamica || typeof edicionDinamica !== 'object') return false;
  if (edicionDinamica.videoDinamico || edicionDinamica.cortes || edicionDinamica.tiempo) return false;
  if (edicionDinamica.omitido && contarPlanEdicion(edicionDinamica, opciones) === 0) return false;
  return Boolean(edicionDinamica.activo || contarPlanEdicion(edicionDinamica, opciones) > 0);
}

function unirEdicionDinamicaRealYPlan(real = null, plan = null, opciones = {}) {
  const planSeguro = plan && typeof plan === 'object' ? plan : {};
  const realSeguro = real && typeof real === 'object' ? real : null;
  if (!realSeguro) return planSeguro;

  const mapaTiempoReal = arr(realSeguro.mapaTiempo);
  const mapaTiempoPlan = arr(planSeguro.mapaTiempo || planSeguro.puentePlanEdicion?.mapaTiempo);
  const eventosVisualesPlan = arr(planSeguro.eventosVisualesPlan || opciones.eventosVisualesPlan || planSeguro.puentePlanEdicion?.eventosVisualesPlan);
  const eventosSonidoPlan = arr(planSeguro.eventosSonidoPlan || opciones.eventosSonidoPlan || planSeguro.puentePlanEdicion?.eventosSonidoPlan);
  const eventosTextoPlan = arr(planSeguro.eventosTextoPlan || opciones.eventosTextoPlan || planSeguro.puentePlanEdicion?.eventosTextoPlan);
  const realActivo = Boolean(realSeguro.activo && !realSeguro.omitido);
  const planActivo = Boolean(planSeguro.activo && !planSeguro.omitido);

  return {
    ...planSeguro,
    ...realSeguro,
    ok: true,
    activo: realActivo || planActivo,
    omitido: !(realActivo || planActivo),
    origen: [realSeguro.origen || 'edicion-dinamica-real', planSeguro.origen].filter(Boolean).join(' + '),
    mapaTiempo: mapaTiempoReal.length ? mapaTiempoReal : mapaTiempoPlan,
    puentePlanEdicion: planSeguro.puentePlanEdicion || realSeguro.puentePlanEdicion || null,
    instruccionesEdicion: arr(planSeguro.instruccionesEdicion || opciones.instruccionesEdicionPlan),
    eventosVisualesPlan,
    eventosSonidoPlan,
    eventosTextoPlan,
    resumenPlanEjecutable: planSeguro.resumenPlanEjecutable || opciones.resumenPuentePlanEdicion || null,
    integracionEdicion: {
      moduloRealEjecutado: true,
      videoDinamicoDisponible: Boolean(realSeguro.videoDinamico),
      transcripcionAjustadaDisponible: Boolean(realSeguro.transcripcionAjustada),
      mapaTiempoReal: mapaTiempoReal.length,
      mapaTiempoPlan: mapaTiempoPlan.length,
      eventosVisualesPlan: eventosVisualesPlan.length,
      eventosSonidoPlan: eventosSonidoPlan.length,
      eventosTextoPlan: eventosTextoPlan.length
    },
    diagnostico: {
      ...(planSeguro.diagnostico || {}),
      ok: true,
      bloqueante: false,
      mensaje: realActivo
        ? 'Edición dinámica real ejecutada y unida al plan aprobado: cortes, video dinámico, efectos visuales y SFX quedan conectados.'
        : 'Edición dinámica real no generó video dinámico, pero el plan aprobado sigue conectado para efectos visuales y SFX.'
    }
  };
}

async function asegurarEdicionDinamicaReal({ entrada, entendimiento, audio, transcripcion, edicionDinamica, opciones, progreso }) {
  if (!necesitaEjecutarEdicionDinamicaReal(edicionDinamica, opciones)) return edicionDinamica;

  await reportarModulo(progreso, {
    etapa: 'editar',
    porcentaje: 75,
    titulo: 'Conectando edición dinámica real',
    detalle: 'El plan de edición tiene efectos/cortes; se ejecuta el módulo real antes del render.',
    archivo: 'editar/editar.conexion.js'
  });

  try {
    const real = await procesarEdicionDinamica({ entrada, entendimiento, audio, transcripcion, opciones, progreso });
    return unirEdicionDinamicaRealYPlan(real, edicionDinamica, opciones);
  } catch (error) {
    await reportarModulo(progreso, {
      etapa: 'editar',
      porcentaje: 76,
      titulo: 'Edición dinámica real omitida',
      detalle: 'Se mantiene el plan para efectos y SFX sin detener la edición.',
      datos: { error: error.message || String(error) },
      archivo: 'editar/editar.conexion.js'
    });
    return unirEdicionDinamicaRealYPlan({ ok: true, activo: false, omitido: true, motivo: error.message || String(error) }, edicionDinamica, opciones);
  }
}

function crearResumenEdicionDinamica(edicionDinamica) {
  return {
    recibida: Boolean(edicionDinamica),
    activa: Boolean(edicionDinamica?.activo),
    omitida: Boolean(edicionDinamica?.omitido),
    videoDinamico: edicionDinamica?.videoDinamico || null,
    tieneMapaTiempo: Boolean(edicionDinamica?.mapaTiempo),
    tieneTranscripcionAjustada: Boolean(edicionDinamica?.transcripcionAjustada),
    eventosVisualesPlan: edicionDinamica?.eventosVisualesPlan?.length || 0,
    eventosSonidoPlan: edicionDinamica?.eventosSonidoPlan?.length || 0,
    integracionEdicion: edicionDinamica?.integracionEdicion || null,
    mensaje: edicionDinamica?.diagnostico?.mensaje || edicionDinamica?.motivo || null
  };
}

async function editarTikTok({ entrada, entendimiento, audio = null, transcripcion = null, edicionDinamica = null, opciones, modo, plataforma, progreso = null }) {
  validarModoTikTok(modo);
  const edicionDinamicaFinal = await asegurarEdicionDinamicaReal({ entrada, entendimiento, audio, transcripcion, edicionDinamica, opciones, progreso });
  const opcionesFinales = { ...opciones, plataforma, modo, edicionDinamicaActiva: Boolean(edicionDinamicaFinal?.activo && !edicionDinamicaFinal?.omitido) };
  const parametros = { entrada, entendimiento, audio, transcripcion, edicionDinamica: edicionDinamicaFinal, opciones: opcionesFinales, progreso };

  await reportarModulo(progreso, { etapa: 'editar', porcentaje: 76, titulo: 'Preparando edición TikTok', detalle: `Modo seleccionado: ${modo}.`, datos: { modo, plataforma, videoDinamico: Boolean(edicionDinamicaFinal?.videoDinamico) }, archivo: 'editar/editar.conexion.js' });

  const resultado = modo === MODOS_TIKTOK.SIMPLE
    ? await crearEdicionTikTokSimple(parametros)
    : await crearEdicionTikTokCuadradoCentro(parametros);

  await reportarModulo(progreso, { etapa: 'editar', porcentaje: 91, titulo: 'Plan de edición generado', detalle: `${resultado.tipo || 'edición'} lista para exportar.`, datos: { tipo: resultado.tipo, modo: resultado.modo, sonidos: Boolean(resultado.sonidos && !resultado.sonidos.omitido), visual: Boolean(resultado.visualDinamico && !resultado.visualDinamico.omitido), videoDinamico: Boolean(edicionDinamicaFinal?.videoDinamico) }, archivo: 'editar/editar.conexion.js' });

  return { ...resultado, edicionDinamica: crearResumenEdicionDinamica(edicionDinamicaFinal), edicionDinamicaUsada: edicionDinamicaFinal };
}

export async function editarVideo({ entrada, entendimiento, audio = null, transcripcion = null, edicionDinamica = null, opciones = {}, progreso = null }) {
  validarEntradaParaEditar(entrada);
  validarEntendimiento(entendimiento);
  const plataforma = normalizarPlataforma(opciones, entrada);
  const modo = normalizarModo(opciones, entrada);
  if (plataforma !== 'tiktok') throw new Error(`Esta versión solo admite TikTok. Plataforma indicada: ${plataforma}`);
  return await editarTikTok({ entrada, entendimiento, audio, transcripcion, edicionDinamica, opciones, modo, plataforma, progreso });
}
