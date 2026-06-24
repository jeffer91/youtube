import { procesarEntrada } from '../entrada/entrada.conexion.js';
import { entenderVideo } from '../entender/entender.conexion.js';
import { mejorarAudioVideo } from '../audio/audio.conexion.js';
import { procesarTranscripcion } from '../transcripcion/transcripcion.conexion.js';
import { procesarEdicionDinamica } from '../editar/edicion-dinamica/edicion-dinamica.conexion.js';
import { editarVideo } from '../editar/editar.conexion.js';
import { prepararSalida } from '../salida/salida.conexion.js';
import { normalizarOpcionesProcesamiento, validarOpcionesProcesamiento } from './opciones-procesamiento.js';
import { crearRespuestaOpcionesProcesamiento } from './resumen-opciones-procesamiento.js';
import { crearReporteImpactoEdicion } from './reporte-impacto-edicion.js';

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
  const opcionesProcesamiento = normalizarOpcionesProcesamiento(opciones.opcionesProcesamiento || opciones);
  return {
    ...opciones,
    plataforma: normalizarTexto(opciones?.plataforma, PLATAFORMA_PREDETERMINADA).toLowerCase(),
    modo: normalizarModoVideo(opciones?.modo),
    opcionesProcesamiento,
    mejorarAudio: opcionesProcesamiento.mejorarAudio,
    modoAudio: normalizarTexto(opciones?.modoAudio, MODO_AUDIO_PREDETERMINADO).toLowerCase(),
    crearTranscripcion: opcionesProcesamiento.transcripcion,
    agregarSubtitulos: opcionesProcesamiento.subtitulos,
    agregarTextosFlotantes: opcionesProcesamiento.textosFlotantes,
    usarGemini: opcionesProcesamiento.textosFlotantes ? convertirBooleano(opciones?.usarGemini, false) : false,
    usarFallbackGemini: opcionesProcesamiento.textosFlotantes ? convertirBooleano(opciones?.usarFallbackGemini, true) : false,
    edicionDinamica: opcionesProcesamiento.cortes,
    activarEdicionDinamica: opcionesProcesamiento.cortes,
    usarEdicionDinamica: opcionesProcesamiento.cortes,
    cortarSilencios: opcionesProcesamiento.cortes,
    modoSeguroEdicionDinamica: convertirBooleano(opciones?.modoSeguroEdicionDinamica, true),
    intensidadEdicion: normalizarTexto(opciones?.intensidadEdicion || opciones?.modoEdicionDinamica, 'automatica'),
    modoEdicionDinamica: normalizarTexto(opciones?.modoEdicionDinamica || opciones?.intensidadEdicion, 'automatica'),
    agregarEfectosVisualesDinamicos: Boolean(opcionesProcesamiento.zooms || opcionesProcesamiento.barraProgreso || opcionesProcesamiento.etiquetasVisuales),
    agregarZooms: opcionesProcesamiento.zooms,
    agregarPunchIn: opcionesProcesamiento.zooms,
    agregarBarraProgreso: opcionesProcesamiento.barraProgreso,
    agregarEtiquetasVisuales: opcionesProcesamiento.etiquetasVisuales,
    agregarSonidosEdicion: opcionesProcesamiento.sonidos,
    modoSonidosEdicion: normalizarTexto(opciones?.modoSonidosEdicion, 'normal'),
    volumenSonidosEdicion: opciones?.volumenSonidosEdicion ?? 0.24,
    separacionMinimaSonidos: opciones?.separacionMinimaSonidos ?? 1.2,
    cantidadMaximaSonidos: opciones?.cantidadMaximaSonidos ?? 16,
    exportacion: opcionesProcesamiento.exportacion
  };
}

async function reportarProgreso(progreso, evento) {
  if (typeof progreso !== 'function') return null;
  try { return await progreso(evento); }
  catch (error) { console.warn('[progreso] No se pudo reportar evento:', error.message); return null; }
}

function crearMensajeFinal({ salida, reporteImpacto }) {
  if (salida?.omitido) return 'Proceso completado. La exportación final fue omitida por selección del usuario.';
  if (!reporteImpacto?.validacionFinal?.ok) return 'Proceso completado con alerta: el video final no pasó toda la validación de entrega.';
  return `Video exportado correctamente. Impacto general: ${reporteImpacto?.porcentajeGeneral || 0}%.`;
}

export async function ejecutarFlujoPrincipal(solicitud) {
  const opciones = normalizarOpciones(solicitud?.opciones || {});
  const validacionOpciones = validarOpcionesProcesamiento(opciones.opcionesProcesamiento);
  if (!validacionOpciones.ok) throw new Error(validacionOpciones.errores[0] || 'No hay funciones seleccionadas para procesar.');

  const respuestaOpciones = crearRespuestaOpcionesProcesamiento(opciones.opcionesProcesamiento);
  const historial = [];
  const progreso = solicitud?.progreso || null;
  let etapaActual = 'inicio';

  try {
    await reportarProgreso(progreso, { etapa: 'inicio', porcentaje: 3, titulo: 'Preparando video', detalle: 'Solicitud recibida por el motor principal.' });
    historial.push(crearRegistroHistorial('inicio', 'Solicitud recibida por el motor principal.', { nombreOriginal: solicitud.nombreOriginal, plataforma: opciones.plataforma, modo: opciones.modo, opcionesProcesamiento: opciones.opcionesProcesamiento, resumenProcesamiento: respuestaOpciones.resumenProcesamiento }));

    etapaActual = 'entrada';
    await reportarProgreso(progreso, { etapa: 'entrada', porcentaje: 10, titulo: 'Copiando video', detalle: 'Guardando el archivo dentro del proyecto.' });
    const entrada = await procesarEntrada({ archivoTemporal: solicitud.archivoTemporal, nombreOriginal: solicitud.nombreOriginal, nombreTemporal: solicitud.nombreTemporal || null, opciones });
    validarResultadoEtapa('entrada', entrada);
    historial.push(crearRegistroHistorial('entrada', 'Video recibido y copiado correctamente.', { proyectoId: entrada.proyecto?.id || null, modo: entrada.proyecto?.modo || opciones.modo }));

    etapaActual = 'entender';
    await reportarProgreso(progreso, { etapa: 'entender', porcentaje: 18, titulo: 'Analizando video', detalle: 'Leyendo duración, orientación, resolución y audio.' });
    const entendimiento = await entenderVideo(entrada);
    validarResultadoEtapa('entender', entendimiento);
    historial.push(crearRegistroHistorial('entender', 'Video analizado correctamente.', { orientacion: entendimiento.analisis?.orientacion || 'desconocida', duracionSegundos: entendimiento.analisis?.duracionSegundos || null, tieneAudio: Boolean(entendimiento.analisis?.tieneAudio) }));

    etapaActual = 'audio';
    await reportarProgreso(progreso, { etapa: 'audio', porcentaje: 28, titulo: opciones.mejorarAudio ? 'Mejorando audio' : 'Audio omitido', detalle: opciones.mejorarAudio ? 'Limpiando ruido y normalizando voz.' : 'La mejora de audio fue desmarcada en el checklist.' });
    const audio = await mejorarAudioVideo({ entrada, entendimiento, opciones });
    validarResultadoEtapa('audio', audio);
    historial.push(crearRegistroHistorial('audio', audio.mensaje || 'Etapa de audio completada.', { tipo: audio.tipo || null, omitido: Boolean(audio.omitido), impacto: audio.impactoAudio?.impacto || 0 }));

    etapaActual = 'transcripcion';
    await reportarProgreso(progreso, { etapa: 'transcripcion', porcentaje: 40, titulo: opciones.crearTranscripcion ? 'Preparando textos' : 'Textos omitidos', detalle: opciones.crearTranscripcion ? 'Creando transcripción, subtítulos y textos flotantes.' : 'La transcripción fue desmarcada en el checklist.' });
    const transcripcion = await procesarTranscripcion({ entrada, entendimiento, audio, opciones });
    validarResultadoEtapa('transcripcion', transcripcion);
    historial.push(crearRegistroHistorial('transcripcion', transcripcion.mensaje || 'Etapa de transcripción completada.', { omitido: Boolean(transcripcion.omitido), segmentos: transcripcion.transcripcion?.cantidadSegmentos || 0 }));

    etapaActual = 'edicion-dinamica';
    await reportarProgreso(progreso, { etapa: 'edicion-dinamica', porcentaje: 55, titulo: opciones.edicionDinamica ? 'Edición dinámica' : 'Edición dinámica omitida', detalle: opciones.edicionDinamica ? 'Detectando pausas, cortando silencios y ajustando tiempos.' : 'Los cortes automáticos fueron desmarcados en el checklist.' });
    const edicionDinamica = await procesarEdicionDinamica({ entrada, entendimiento, audio, transcripcion, opciones, progreso });
    validarResultadoEtapa('edicion-dinamica', edicionDinamica);
    historial.push(crearRegistroHistorial('edicion-dinamica', edicionDinamica.diagnostico?.mensaje || edicionDinamica.motivo || 'Etapa de edición dinámica completada.', { activo: Boolean(edicionDinamica.activo), omitido: Boolean(edicionDinamica.omitido), impacto: edicionDinamica.impactoEdicionDinamica?.impacto || 0 }));

    etapaActual = 'editar';
    await reportarProgreso(progreso, { etapa: 'editar', porcentaje: 76, titulo: 'Preparando plan visual', detalle: 'Aplicando únicamente las capas seleccionadas en el checklist.' });
    const edicion = await editarVideo({ entrada, entendimiento, audio, transcripcion, edicionDinamica, opciones, progreso });
    validarResultadoEtapa('editar', edicion);
    historial.push(crearRegistroHistorial('editar', 'Plan de edición generado correctamente.', { modo: edicion.modo || opciones.modo, filtroVideo: edicion.render?.filtroVideo || null }));

    etapaActual = 'salida';
    await reportarProgreso(progreso, { etapa: 'salida', porcentaje: 90, titulo: opciones.exportacion ? 'Exportando video final' : 'Exportación omitida', detalle: opciones.exportacion ? 'Generando MP4 final.' : 'No se generará archivo final porque Exportar video final está desmarcado.' });
    const salida = await prepararSalida({ entrada, entendimiento, audio, edicion, opciones, progreso });
    validarResultadoEtapa('salida', salida);

    const reporteImpacto = crearReporteImpactoEdicion({ entrada, entendimiento, audio, transcripcion, edicionDinamica, edicion, salida, opciones, historial, videoEditadoUrl: salida?.urlPublica || null });
    const validacionFinal = reporteImpacto.validacionFinal;
    historial.push(crearRegistroHistorial('salida', salida.omitido ? 'Exportación omitida por selección del usuario.' : 'Video exportado correctamente.', { nombreExportado: salida.nombreExportado || null, urlPublica: salida.urlPublica || null, omitido: Boolean(salida.omitido), porcentajeEntrega: validacionFinal?.porcentajeEntrega || 0 }));
    historial.push(crearRegistroHistorial('reporte-impacto', 'Reporte de impacto generado.', { porcentajeGeneral: reporteImpacto.porcentajeGeneral, entregaFinal: validacionFinal?.porcentajeEntrega || 0 }));

    return {
      ok: true,
      estado: salida.omitido ? 'PROCESO_COMPLETADO_SIN_EXPORTACION' : (validacionFinal.ok ? 'VIDEO_PROCESADO_VALIDADO' : 'VIDEO_PROCESADO_CON_ALERTA'),
      mensaje: crearMensajeFinal({ salida, reporteImpacto }),
      proyecto: entrada.proyecto,
      video: entrada.video,
      entendimiento,
      audio,
      transcripcion,
      edicionDinamica,
      edicion,
      resultado: salida,
      opcionesProcesamiento: opciones.opcionesProcesamiento,
      resumenProcesamiento: respuestaOpciones.resumenProcesamiento,
      detalleProcesamiento: respuestaOpciones.detalleProcesamiento,
      reporteImpacto,
      validacionFinal,
      historial
    };
  } catch (error) {
    const mensaje = error?.message || 'Error desconocido en el flujo principal.';
    error.etapa = error.etapa || etapaActual;
    historial.push(crearRegistroHistorial('error', 'El flujo principal se detuvo por un error.', { detalle: mensaje, modo: opciones.modo, etapa: etapaActual }));
    throw new Error(`[flujo-principal:${etapaActual}] ${mensaje}`);
  }
}
