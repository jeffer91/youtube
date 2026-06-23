import { procesarEntrada } from '../entrada/entrada.conexion.js';
import { entenderVideo } from '../entender/entender.conexion.js';
import { mejorarAudioVideo } from '../audio/audio.conexion.js';
import { procesarTranscripcion } from '../transcripcion/transcripcion.conexion.js';
import { procesarEdicionDinamica } from '../editar/edicion-dinamica/edicion-dinamica.conexion.js';
import { editarVideo } from '../editar/editar.conexion.js';
import { prepararSalida } from '../salida/salida.conexion.js';

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

function crearMensajeFinal({ salida, audio, edicion, transcripcion, edicionDinamica }) {
  const modo = edicion?.modo || salida?.modo || MODO_VIDEO_PREDETERMINADO;
  const audioUsado = salida?.audio?.tipo || audio?.tipo || 'original';
  const capas = transcripcion?.capasVideo;
  const partes = [`Video exportado correctamente en modo ${modo}`];
  if (edicionDinamica?.activo && !edicionDinamica?.omitido) partes.push('con edición automática');
  partes.push(audioUsado === 'sonidos-edicion' ? 'con efectos de sonido' : audioUsado === 'mejorado' ? 'con audio mejorado' : 'con audio procesado');
  if (capas?.usarSubtitulos || edicion?.transcripcion?.capasAplicadas) partes.push('subtítulos/textos');
  return `${partes.join(', ')}.`;
}

export async function ejecutarFlujoPrincipal(solicitud) {
  const opciones = normalizarOpciones(solicitud?.opciones || {});
  const historial = [];

  try {
    historial.push(crearRegistroHistorial('inicio', 'Solicitud recibida por el motor principal.', { nombreOriginal: solicitud.nombreOriginal, plataforma: opciones.plataforma, modo: opciones.modo, mejorarAudio: opciones.mejorarAudio, modoAudio: opciones.modoAudio, crearTranscripcion: opciones.crearTranscripcion, edicionDinamica: opciones.edicionDinamica, intensidadEdicion: opciones.intensidadEdicion }));

    const entrada = await procesarEntrada({ archivoTemporal: solicitud.archivoTemporal, nombreOriginal: solicitud.nombreOriginal, nombreTemporal: solicitud.nombreTemporal || null, opciones });
    validarResultadoEtapa('entrada', entrada);
    historial.push(crearRegistroHistorial('entrada', 'Video recibido y copiado correctamente.', { proyectoId: entrada.proyecto?.id || null, modo: entrada.proyecto?.modo || opciones.modo }));

    const entendimiento = await entenderVideo(entrada);
    validarResultadoEtapa('entender', entendimiento);
    historial.push(crearRegistroHistorial('entender', 'Video analizado correctamente.', { orientacion: entendimiento.analisis?.orientacion || 'desconocida', duracionSegundos: entendimiento.analisis?.duracionSegundos || null, tieneAudio: Boolean(entendimiento.analisis?.tieneAudio) }));

    const audio = await mejorarAudioVideo({ entrada, entendimiento, opciones });
    validarResultadoEtapa('audio', audio);
    historial.push(crearRegistroHistorial('audio', audio.mensaje || 'Etapa de audio completada.', { tipo: audio.tipo || null, omitido: Boolean(audio.omitido), usarAudioMejorado: Boolean(audio.usarAudioMejorado), nombreAudioMejorado: audio.nombreAudioMejorado || null }));

    const transcripcion = await procesarTranscripcion({ entrada, entendimiento, audio, opciones });
    validarResultadoEtapa('transcripcion', transcripcion);
    historial.push(crearRegistroHistorial('transcripcion', transcripcion.mensaje || 'Etapa de transcripción completada.', { omitido: Boolean(transcripcion.omitido), segmentos: transcripcion.transcripcion?.cantidadSegmentos || 0, subtitulos: Boolean(transcripcion.capasVideo?.usarSubtitulos), textosFlotantes: transcripcion.textosFlotantes?.cantidad || 0 }));

    const edicionDinamica = await procesarEdicionDinamica({ entrada, entendimiento, audio, transcripcion, opciones });
    validarResultadoEtapa('edicion-dinamica', edicionDinamica);
    historial.push(crearRegistroHistorial('edicion-dinamica', edicionDinamica.diagnostico?.mensaje || edicionDinamica.motivo || 'Etapa de edición dinámica completada.', { activo: Boolean(edicionDinamica.activo), omitido: Boolean(edicionDinamica.omitido), videoDinamico: edicionDinamica.videoDinamico || null, cortesAplicados: edicionDinamica.cortes?.resumen?.cantidadCortesAplicados || 0, segundosEliminados: edicionDinamica.cortes?.resumen?.segundosEliminados || 0, tieneMapaTiempo: Boolean(edicionDinamica.mapaTiempo) }));

    const edicion = await editarVideo({ entrada, entendimiento, audio, transcripcion, edicionDinamica, opciones });
    validarResultadoEtapa('editar', edicion);
    historial.push(crearRegistroHistorial('editar', 'Plan de edición generado correctamente.', { tipo: edicion.tipo || null, modo: edicion.modo || opciones.modo, formato: edicion.salida?.formato || null, filtroVideo: edicion.render?.filtroVideo || null, capasTranscripcionAplicadas: Boolean(edicion.transcripcion?.capasAplicadas), visualDinamicoAplicado: Boolean(edicion.visualDinamico && !edicion.visualDinamico.omitido), sonidosAplicados: Boolean(edicion.sonidos && !edicion.sonidos.omitido) }));

    const salida = await prepararSalida({ entrada, entendimiento, audio, edicion, opciones });
    validarResultadoEtapa('salida', salida);
    historial.push(crearRegistroHistorial('salida', 'Video exportado correctamente.', { nombreExportado: salida.nombreExportado || null, urlPublica: salida.urlPublica || null, modo: salida.modo || edicion.modo || opciones.modo, audioUsado: salida.audio?.tipo || null }));

    return { ok: true, estado: 'VIDEO_PROCESADO', mensaje: crearMensajeFinal({ salida, audio, edicion, transcripcion, edicionDinamica }), proyecto: entrada.proyecto, video: entrada.video, entendimiento, audio, transcripcion, edicionDinamica, edicion, resultado: salida, historial };
  } catch (error) {
    const mensaje = error?.message || 'Error desconocido en el flujo principal.';
    historial.push(crearRegistroHistorial('error', 'El flujo principal se detuvo por un error.', { detalle: mensaje, modo: opciones.modo }));
    throw new Error(`[flujo-principal] ${mensaje}`);
  }
}
