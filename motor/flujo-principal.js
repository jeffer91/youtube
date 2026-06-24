import { procesarEntrada } from '../entrada/entrada.conexion.js';
import { entenderVideo } from '../entender/entender.conexion.js';
import { mejorarAudioVideo } from '../audio/audio.conexion.js';
import { procesarTranscripcion } from '../transcripcion/transcripcion.conexion.js';
import { procesarEdicionDinamica } from '../editar/edicion-dinamica/edicion-dinamica.conexion.js';
import { editarVideo } from '../editar/editar.conexion.js';
import { prepararSalida } from '../salida/salida.conexion.js';
import { normalizarOpcionesProcesamiento, validarOpcionesProcesamiento } from './opciones-procesamiento.js';
import { crearRespuestaOpcionesProcesamiento } from './resumen-opciones-procesamiento.js';

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
  try {
    return await progreso(evento);
  } catch (error) {
    console.warn('[progreso] No se pudo reportar evento:', error.message);
    return null;
  }
}

function crearMensajeFinal({ salida, audio, edicion, transcripcion, edicionDinamica, opciones }) {
  if (salida?.omitido) return 'Proceso completado. La exportación final fue omitida por selección del usuario.';

  const modo = edicion?.modo || salida?.modo || MODO_VIDEO_PREDETERMINADO;
  const audioUsado = salida?.audio?.tipo || audio?.tipo || 'original';
  const capas = transcripcion?.capasVideo;
  const partes = [`Video exportado correctamente en modo ${modo}`];

  if (edicionDinamica?.activo && !edicionDinamica?.omitido) partes.push('con edición automática');

  if (audioUsado === 'sonidos-edicion') partes.push('con efectos de sonido');
  else if (audioUsado === 'mejorado') partes.push('con audio mejorado');
  else if (opciones?.mejorarAudio) partes.push('con audio procesado');
  else partes.push('con audio original');

  if (capas?.usarSubtitulos || edicion?.transcripcion?.capasAplicadas) partes.push('subtítulos/textos');

  return `${partes.join(', ')}.`;
}

export async function ejecutarFlujoPrincipal(solicitud) {
  const opciones = normalizarOpciones(solicitud?.opciones || {});
  const validacionOpciones = validarOpcionesProcesamiento(opciones.opcionesProcesamiento);

  if (!validacionOpciones.ok) {
    throw new Error(validacionOpciones.errores[0] || 'No hay funciones seleccionadas para procesar.');
  }

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
    await reportarProgreso(progreso, { etapa: 'entrada', porcentaje: 15, titulo: 'Video recibido', detalle: 'Video copiado correctamente.', datos: { proyectoId: entrada.proyecto?.id || null } });

    etapaActual = 'entender';
    await reportarProgreso(progreso, { etapa: 'entender', porcentaje: 18, titulo: 'Analizando video', detalle: 'Leyendo duración, orientación, resolución y audio.' });
    const entendimiento = await entenderVideo(entrada);
    validarResultadoEtapa('entender', entendimiento);
    historial.push(crearRegistroHistorial('entender', 'Video analizado correctamente.', { orientacion: entendimiento.analisis?.orientacion || 'desconocida', duracionSegundos: entendimiento.analisis?.duracionSegundos || null, tieneAudio: Boolean(entendimiento.analisis?.tieneAudio) }));
    await reportarProgreso(progreso, { etapa: 'entender', porcentaje: 24, titulo: 'Video analizado', detalle: `Duración: ${entendimiento.analisis?.duracionSegundos || 0}s · Audio: ${entendimiento.analisis?.tieneAudio ? 'sí' : 'no'}.`, datos: entendimiento.analisis || {} });

    etapaActual = 'audio';
    await reportarProgreso(progreso, { etapa: 'audio', porcentaje: 28, titulo: opciones.mejorarAudio ? 'Mejorando audio' : 'Audio omitido', detalle: opciones.mejorarAudio ? 'Limpiando ruido y normalizando voz.' : 'La mejora de audio fue desmarcada en el checklist.' });
    const audio = await mejorarAudioVideo({ entrada, entendimiento, opciones });
    validarResultadoEtapa('audio', audio);
    historial.push(crearRegistroHistorial('audio', audio.mensaje || 'Etapa de audio completada.', { tipo: audio.tipo || null, omitido: Boolean(audio.omitido), usarAudioMejorado: Boolean(audio.usarAudioMejorado), nombreAudioMejorado: audio.nombreAudioMejorado || null }));
    await reportarProgreso(progreso, { etapa: 'audio', porcentaje: 34, titulo: 'Audio procesado', detalle: audio.mensaje || 'Etapa de audio completada.', datos: { tipo: audio.tipo || null, omitido: Boolean(audio.omitido), usarAudioMejorado: Boolean(audio.usarAudioMejorado) } });

    etapaActual = 'transcripcion';
    await reportarProgreso(progreso, { etapa: 'transcripcion', porcentaje: 40, titulo: opciones.crearTranscripcion ? 'Preparando textos' : 'Textos omitidos', detalle: opciones.crearTranscripcion ? 'Creando transcripción, subtítulos y textos flotantes.' : 'La transcripción fue desmarcada en el checklist.' });
    const transcripcion = await procesarTranscripcion({ entrada, entendimiento, audio, opciones });
    validarResultadoEtapa('transcripcion', transcripcion);
    historial.push(crearRegistroHistorial('transcripcion', transcripcion.mensaje || 'Etapa de transcripción completada.', { omitido: Boolean(transcripcion.omitido), segmentos: transcripcion.transcripcion?.cantidadSegmentos || 0, subtitulos: Boolean(transcripcion.capasVideo?.usarSubtitulos), textosFlotantes: transcripcion.textosFlotantes?.cantidad || 0 }));
    await reportarProgreso(progreso, { etapa: 'transcripcion', porcentaje: 50, titulo: 'Textos preparados', detalle: `${transcripcion.transcripcion?.cantidadSegmentos || 0} segmentos · ${transcripcion.textosFlotantes?.cantidad || 0} textos flotantes.`, datos: { segmentos: transcripcion.transcripcion?.cantidadSegmentos || 0, textosFlotantes: transcripcion.textosFlotantes?.cantidad || 0, omitido: Boolean(transcripcion.omitido) } });

    etapaActual = 'edicion-dinamica';
    await reportarProgreso(progreso, { etapa: 'edicion-dinamica', porcentaje: 55, titulo: opciones.edicionDinamica ? 'Edición dinámica' : 'Edición dinámica omitida', detalle: opciones.edicionDinamica ? 'Detectando pausas, cortando silencios y ajustando tiempos.' : 'Los cortes automáticos fueron desmarcados en el checklist.' });
    const edicionDinamica = await procesarEdicionDinamica({ entrada, entendimiento, audio, transcripcion, opciones, progreso });
    validarResultadoEtapa('edicion-dinamica', edicionDinamica);
    historial.push(crearRegistroHistorial('edicion-dinamica', edicionDinamica.diagnostico?.mensaje || edicionDinamica.motivo || 'Etapa de edición dinámica completada.', { activo: Boolean(edicionDinamica.activo), omitido: Boolean(edicionDinamica.omitido), videoDinamico: edicionDinamica.videoDinamico || null, cortesAplicados: edicionDinamica.cortes?.resumen?.cantidadCortesAplicados || 0, segundosEliminados: edicionDinamica.cortes?.resumen?.segundosEliminados || 0, tieneMapaTiempo: Boolean(edicionDinamica.mapaTiempo) }));

    etapaActual = 'editar';
    await reportarProgreso(progreso, { etapa: 'editar', porcentaje: 76, titulo: 'Preparando plan visual', detalle: 'Aplicando únicamente las capas seleccionadas en el checklist.' });
    const edicion = await editarVideo({ entrada, entendimiento, audio, transcripcion, edicionDinamica, opciones, progreso });
    validarResultadoEtapa('editar', edicion);
    historial.push(crearRegistroHistorial('editar', 'Plan de edición generado correctamente.', { tipo: edicion.tipo || null, modo: edicion.modo || opciones.modo, formato: edicion.salida?.formato || null, filtroVideo: edicion.render?.filtroVideo || null, capasTranscripcionAplicadas: Boolean(edicion.transcripcion?.capasAplicadas), visualDinamicoAplicado: Boolean(edicion.visualDinamico && !edicion.visualDinamico.omitido), sonidosAplicados: Boolean(edicion.sonidos && !edicion.sonidos.omitido) }));

    etapaActual = 'salida';
    await reportarProgreso(progreso, { etapa: 'salida', porcentaje: 90, titulo: opciones.exportacion ? 'Exportando video final' : 'Exportación omitida', detalle: opciones.exportacion ? 'Generando MP4 final.' : 'No se generará archivo final porque Exportar video final está desmarcado.' });
    const salida = await prepararSalida({ entrada, entendimiento, audio, edicion, opciones, progreso });
    validarResultadoEtapa('salida', salida);
    historial.push(crearRegistroHistorial('salida', salida.omitido ? 'Exportación omitida por selección del usuario.' : 'Video exportado correctamente.', { nombreExportado: salida.nombreExportado || null, urlPublica: salida.urlPublica || null, modo: salida.modo || edicion.modo || opciones.modo, audioUsado: salida.audio?.tipo || null, omitido: Boolean(salida.omitido) }));

    return {
      ok: true,
      estado: salida.omitido ? 'PROCESO_COMPLETADO_SIN_EXPORTACION' : 'VIDEO_PROCESADO',
      mensaje: crearMensajeFinal({ salida, audio, edicion, transcripcion, edicionDinamica, opciones }),
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
      historial
    };
  } catch (error) {
    const mensaje = error?.message || 'Error desconocido en el flujo principal.';
    error.etapa = error.etapa || etapaActual;
    historial.push(crearRegistroHistorial('error', 'El flujo principal se detuvo por un error.', { detalle: mensaje, modo: opciones.modo, etapa: etapaActual }));
    throw new Error(`[flujo-principal:${etapaActual}] ${mensaje}`);
  }
}
