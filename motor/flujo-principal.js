import { procesarEntrada } from '../entrada/entrada.conexion.js';
import { entenderVideo } from '../entender/entender.conexion.js';
import { mejorarAudioVideo } from '../audio/audio.conexion.js';
import { procesarTranscripcion } from '../transcripcion/transcripcion.conexion.js';
import { procesarEdicionDinamica } from '../editar/edicion-dinamica/edicion-dinamica.conexion.js';
import { editarVideo } from '../editar/editar.conexion.js';
import { prepararSalida } from '../salida/salida.conexion.js';
import { crearIntegracionModularAutoVideoJeff } from './flujo-modular-autovideo.service.js';

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

function normalizarLista(valor, defecto = []) {
  if (Array.isArray(valor)) return valor.filter(Boolean);
  if (typeof valor === 'string' && valor.trim()) return valor.split(',').map((item) => item.trim()).filter(Boolean);
  return defecto;
}

function normalizarOpciones(opciones = {}) {
  const plataforma = normalizarTexto(opciones?.plataforma, PLATAFORMA_PREDETERMINADA).toLowerCase();
  return {
    ...opciones,
    plataforma,
    plataformas: normalizarLista(opciones?.plataformas, [plataforma]),
    perfil: normalizarTexto(opciones?.perfil, 'general'),
    modoEdicion: normalizarTexto(opciones?.modoEdicion, 'revision_completa'),
    modo: normalizarModoVideo(opciones?.modo),
    mejorarAudio: convertirBooleano(opciones?.mejorarAudio, true),
    modoAudio: normalizarTexto(opciones?.modoAudio, MODO_AUDIO_PREDETERMINADO).toLowerCase(),
    crearTranscripcion: convertirBooleano(opciones?.crearTranscripcion, true),
    agregarSubtitulos: convertirBooleano(opciones?.agregarSubtitulos, true),
    agregarTextosFlotantes: convertirBooleano(opciones?.agregarTextosFlotantes, true),
    usarGemini: convertirBooleano(opciones?.usarGemini, false),
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
    cantidadMaximaSonidos: opciones?.cantidadMaximaSonidos ?? 16
  };
}

async function reportarProgreso(progreso, evento) {
  if (typeof progreso !== 'function') return null;
  try { return await progreso(evento); } catch (error) { console.warn('[progreso] No se pudo reportar evento:', error.message); return null; }
}

function crearMensajeFinal({ salida, audio, edicion, transcripcion, edicionDinamica, modular }) {
  const modo = edicion?.modo || salida?.modo || MODO_VIDEO_PREDETERMINADO;
  const audioUsado = salida?.audio?.tipo || audio?.tipo || 'original';
  const capas = transcripcion?.capasVideo;
  const partes = [`Video exportado correctamente en modo ${modo}`];
  if (edicionDinamica?.activo && !edicionDinamica?.omitido) partes.push('con edición automática');
  partes.push(audioUsado === 'sonidos-edicion' ? 'con efectos de sonido' : audioUsado === 'mejorado' ? 'con audio mejorado' : 'con audio procesado');
  if (capas?.usarSubtitulos || edicion?.transcripcion?.capasAplicadas) partes.push('subtítulos/textos');
  if (salida?.antesDespues?.ok) partes.push('antes/después');
  if (modular?.ok) partes.push('módulos nuevos conectados');
  return `${partes.join(', ')}.`;
}

export async function ejecutarFlujoPrincipal(solicitud) {
  const opciones = normalizarOpciones(solicitud?.opciones || {});
  const historial = [];
  const progreso = solicitud?.progreso || null;
  let etapaActual = 'inicio';

  try {
    await reportarProgreso(progreso, { etapa: 'inicio', porcentaje: 3, titulo: 'Preparando video', detalle: 'Solicitud recibida por el motor principal.' });
    historial.push(crearRegistroHistorial('inicio', 'Solicitud recibida por el motor principal.', { nombreOriginal: solicitud.nombreOriginal, plataforma: opciones.plataforma, plataformas: opciones.plataformas, perfil: opciones.perfil, modo: opciones.modo, mejorarAudio: opciones.mejorarAudio, modoAudio: opciones.modoAudio, crearTranscripcion: opciones.crearTranscripcion, edicionDinamica: opciones.edicionDinamica, intensidadEdicion: opciones.intensidadEdicion }));

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
    await reportarProgreso(progreso, { etapa: 'audio', porcentaje: 28, titulo: 'Mejorando audio', detalle: 'Limpiando ruido y normalizando voz.' });
    const audio = await mejorarAudioVideo({ entrada, entendimiento, opciones });
    validarResultadoEtapa('audio', audio);
    historial.push(crearRegistroHistorial('audio', audio.mensaje || 'Etapa de audio completada.', { tipo: audio.tipo || null, omitido: Boolean(audio.omitido), usarAudioMejorado: Boolean(audio.usarAudioMejorado), nombreAudioMejorado: audio.nombreAudioMejorado || null }));
    await reportarProgreso(progreso, { etapa: 'audio', porcentaje: 34, titulo: 'Audio procesado', detalle: audio.mensaje || 'Etapa de audio completada.', datos: { tipo: audio.tipo || null, omitido: Boolean(audio.omitido), usarAudioMejorado: Boolean(audio.usarAudioMejorado) } });

    etapaActual = 'transcripcion';
    await reportarProgreso(progreso, { etapa: 'transcripcion', porcentaje: 40, titulo: 'Preparando textos', detalle: 'Creando transcripción, subtítulos y textos flotantes.' });
    const transcripcion = await procesarTranscripcion({ entrada, entendimiento, audio, opciones });
    validarResultadoEtapa('transcripcion', transcripcion);
    historial.push(crearRegistroHistorial('transcripcion', transcripcion.mensaje || 'Etapa de transcripción completada.', { omitido: Boolean(transcripcion.omitido), segmentos: transcripcion.transcripcion?.cantidadSegmentos || 0, subtitulos: Boolean(transcripcion.capasVideo?.usarSubtitulos), textosFlotantes: transcripcion.textosFlotantes?.cantidad || 0 }));
    await reportarProgreso(progreso, { etapa: 'transcripcion', porcentaje: 50, titulo: 'Textos preparados', detalle: `${transcripcion.transcripcion?.cantidadSegmentos || 0} segmentos · ${transcripcion.textosFlotantes?.cantidad || 0} textos flotantes.`, datos: { segmentos: transcripcion.transcripcion?.cantidadSegmentos || 0, textosFlotantes: transcripcion.textosFlotantes?.cantidad || 0 } });

    etapaActual = 'edicion-dinamica';
    await reportarProgreso(progreso, { etapa: 'edicion-dinamica', porcentaje: 55, titulo: 'Edición dinámica', detalle: 'Detectando pausas, cortando silencios y ajustando tiempos.' });
    const edicionDinamica = await procesarEdicionDinamica({ entrada, entendimiento, audio, transcripcion, opciones, progreso });
    validarResultadoEtapa('edicion-dinamica', edicionDinamica);
    historial.push(crearRegistroHistorial('edicion-dinamica', edicionDinamica.diagnostico?.mensaje || edicionDinamica.motivo || 'Etapa de edición dinámica completada.', { activo: Boolean(edicionDinamica.activo), omitido: Boolean(edicionDinamica.omitido), videoDinamico: edicionDinamica.videoDinamico || null, cortesAplicados: edicionDinamica.cortes?.resumen?.cantidadCortesAplicados || 0, segundosEliminados: edicionDinamica.cortes?.resumen?.segundosEliminados || 0, tieneMapaTiempo: Boolean(edicionDinamica.mapaTiempo) }));

    etapaActual = 'editar';
    await reportarProgreso(progreso, { etapa: 'editar', porcentaje: 76, titulo: 'Agregando visuales y sonidos', detalle: 'Aplicando textos, barra, zooms y sonidos sincronizados.' });
    const edicion = await editarVideo({ entrada, entendimiento, audio, transcripcion, edicionDinamica, opciones, progreso });
    validarResultadoEtapa('editar', edicion);
    historial.push(crearRegistroHistorial('editar', 'Plan de edición generado correctamente.', { tipo: edicion.tipo || null, modo: edicion.modo || opciones.modo, formato: edicion.salida?.formato || null, filtroVideo: edicion.render?.filtroVideo || null, capasTranscripcionAplicadas: Boolean(edicion.transcripcion?.capasAplicadas), visualDinamicoAplicado: Boolean(edicion.visualDinamico && !edicion.visualDinamico.omitido), sonidosAplicados: Boolean(edicion.sonidos && !edicion.sonidos.omitido) }));

    etapaActual = 'salida';
    await reportarProgreso(progreso, { etapa: 'salida', porcentaje: 90, titulo: 'Exportando video final', detalle: 'Generando MP4 final.' });
    const salida = await prepararSalida({ entrada, entendimiento, audio, transcripcion, edicionDinamica, edicion, opciones, progreso });
    validarResultadoEtapa('salida', salida);
    historial.push(crearRegistroHistorial('salida', 'Video exportado correctamente con antes/después.', { nombreExportado: salida.nombreExportado || null, urlPublica: salida.urlPublica || null, antesDespues: Boolean(salida.antesDespues?.ok), modo: salida.modo || edicion.modo || opciones.modo, audioUsado: salida.audio?.tipo || null }));

    etapaActual = 'modular';
    await reportarProgreso(progreso, { etapa: 'modular', porcentaje: 96, titulo: 'Conectando módulos nuevos', detalle: 'Preparando producción, perfiles, exportaciones, Gemini y aprendizaje.' });
    const modular = await crearIntegracionModularAutoVideoJeff({ entrada, entendimiento, audio, transcripcion, edicionDinamica, edicion, salida, opciones });
    historial.push(crearRegistroHistorial('modular', 'Módulos nuevos conectados al flujo principal.', { perfil: modular.perfil?.id || opciones.perfil, plataformas: modular.plataformas, elementosProduccion: modular.produccion?.elementos?.length || 0, exportaciones: modular.exportaciones?.length || 0 }));

    return { ok: true, estado: 'VIDEO_PROCESADO', mensaje: crearMensajeFinal({ salida, audio, edicion, transcripcion, edicionDinamica, modular }), proyecto: entrada.proyecto, video: entrada.video, entendimiento, audio, transcripcion, edicionDinamica, edicion, modular, produccion: modular.produccion, exportaciones: modular.exportaciones, resultado: salida, historial };
  } catch (error) {
    const mensaje = error?.message || 'Error desconocido en el flujo principal.';
    error.etapa = error.etapa || etapaActual;
    historial.push(crearRegistroHistorial('error', 'El flujo principal se detuvo por un error.', { detalle: mensaje, modo: opciones.modo, etapa: etapaActual }));
    throw new Error(`[flujo-principal:${etapaActual}] ${mensaje}`);
  }
}
