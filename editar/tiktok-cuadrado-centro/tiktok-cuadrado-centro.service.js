import path from 'path';
import { escribirJson } from '../../comun/archivos.js';
import { reportarModulo } from '../../progreso/progreso-modulo.js';
import { obtenerConfigTikTokCuadradoCentro } from './tiktok-cuadrado-centro.config.js';
import { normalizarMedidasVideo } from './normalizar-medidas-video.js';
import { calcularRecorteCuadrado } from './calcular-recorte-cuadrado.js';
import { calcularLienzoVertical } from './calcular-lienzo-vertical.js';
import { construirDetalleFiltroFfmpeg } from './construir-filtro-ffmpeg.js';
import { crearNombreExportadoTikTokCuadradoCentro } from './crear-nombre-exportado.js';
import { aplicarCapasTranscripcion } from '../comun/aplicar-capas-transcripcion.js';
import { procesarVisualDinamico } from '../edicion-dinamica/visual/visual.conexion.js';
import { procesarSonidosEdicion } from '../edicion-dinamica/sonidos/sonidos.conexion.js';
import { procesarMotorEfectos } from '../efectos/efectos.conexion.js';
import { aplicarAnimacionesRender } from '../animaciones/animaciones-render.service.js';

function validarEntradaServicio({ entrada, entendimiento }) {
  if (!entrada || typeof entrada !== 'object') throw new Error('Entrada inválida para edición cuadrado centro.');
  if (!entrada?.video?.rutaOriginal) throw new Error('Falta ruta del video original.');
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('Falta carpeta del proyecto.');
  if (!entrada?.proyecto?.id) throw new Error('Falta ID del proyecto.');
  if (!entendimiento || typeof entendimiento !== 'object') throw new Error('Falta entendimiento del video.');
  if (entendimiento.ok !== true) throw new Error('El análisis del video no terminó correctamente.');
}

function seleccionarVideoRender(entrada, edicionDinamica) {
  if (edicionDinamica?.activo && !edicionDinamica?.omitido && edicionDinamica?.videoDinamico) return { ruta: edicionDinamica.videoDinamico, origen: 'edicion-dinamica', usarAudioDelVideoRender: true };
  return { ruta: entrada.video.rutaOriginal, origen: 'original', usarAudioDelVideoRender: false };
}

function seleccionarTranscripcionRender(transcripcion, edicionDinamica) { return edicionDinamica?.transcripcionAjustada || transcripcion; }

function combinarVisualConMotor(visualDinamico, motorEfectos) {
  if (!motorEfectos || motorEfectos.omitido || !motorEfectos.filtroVideo) return { ...visualDinamico, motorEfectos };
  return { ...visualDinamico, omitido: false, mensaje: 'Visual dinámico y motor de efectos aplicado.', filtroVideo: motorEfectos.filtroVideo, motorEfectos, filtrosAplicados: Number(visualDinamico?.filtrosAplicados || 0) + Number(motorEfectos?.filtrosAplicados || 0), detalle: { ...(visualDinamico?.detalle || {}), motorEfectos: motorEfectos.detalle || null } };
}

function aplicarAnimacionesAVisual({ visualConMotor, entendimiento, transcripcionRender, edicionDinamica, lienzo, config, opciones }) {
  const animacionesRender = aplicarAnimacionesRender({ filtroBase: visualConMotor.filtroVideo, entendimiento, transcripcion: transcripcionRender, edicionDinamica, salida: { width: lienzo.anchoFinal, height: lienzo.altoFinal, fps: config.video.fps }, opciones });
  return { ...visualConMotor, omitido: false, mensaje: animacionesRender.omitido ? visualConMotor.mensaje || 'Visual dinámico aplicado.' : `${visualConMotor.mensaje || 'Visual dinámico aplicado.'} Animaciones renderizadas.`, filtroVideo: animacionesRender.filtroVideo || visualConMotor.filtroVideo, animacionesRender, filtrosAplicados: Number(visualConMotor?.filtrosAplicados || 0) + Number(animacionesRender?.filtrosAplicados || 0), detalle: { ...(visualConMotor?.detalle || {}), animacionesRender: { total: animacionesRender.animaciones?.length || 0, intensidad: animacionesRender.intensidad || null } } };
}

function crearNotasEdicion({ recorte, lienzo, capasTranscripcion, visualDinamico, sonidos, videoRender }) {
  const notas = ['Preset TikTok cuadrado centro.', `Recorte ${recorte.anchoRecorte}x${recorte.altoRecorte}.`, `Lienzo ${lienzo.anchoFinal}x${lienzo.altoFinal}.`];
  if (videoRender?.origen === 'edicion-dinamica') notas.push('Usa video dinámico.');
  if (capasTranscripcion?.aplicadas) notas.push('Capas de transcripción aplicadas.');
  if (visualDinamico && !visualDinamico.omitido) notas.push('Visual dinámico aplicado.');
  if (visualDinamico?.motorEfectos && !visualDinamico.motorEfectos.omitido) notas.push(`Motor de efectos aplicado: ${visualDinamico.motorEfectos.filtrosAplicados || 0} filtros.`);
  if (visualDinamico?.animacionesRender && !visualDinamico.animacionesRender.omitido) notas.push(`Animaciones renderizadas: ${visualDinamico.animacionesRender.animaciones?.length || 0}.`);
  if (sonidos && !sonidos.omitido) notas.push('Audio final con voz al frente y sonidos aplicado.');
  return notas;
}

function construirEdicion({ entrada, entendimiento, opciones, config, medidas, recorte, lienzo, detalleFiltro, capasTranscripcion, visualDinamico, sonidos, nombreExportado, rutaEdicion, nombreArchivoEdicion, videoRender, edicionDinamica }) {
  return { ok: true, etapa: 'editar', tipo: config.nombre, plataforma: config.plataforma, modo: config.modo, preset: { nombre: config.nombre, version: config.version, descripcion: config.descripcion, video: config.video, recorte: config.recorte, exportacion: config.exportacion }, entrada: { rutaVideoOriginal: entrada.video.rutaOriginal, rutaVideoRender: videoRender.ruta, origenVideoRender: videoRender.origen, nombreOriginal: entrada.video.nombreOriginal || null, nombreSeguro: entrada.video.nombreSeguro || null, orientacionDetectada: medidas.orientacionDetectada, medidasOriginales: { width: medidas.anchoOriginal, height: medidas.altoOriginal, fps: medidas.fps, duracionSegundos: medidas.duracionSegundos, relacionAspectoOriginal: medidas.relacionAspectoOriginal }, tieneAudio: medidas.tieneAudio, tieneVideo: medidas.tieneVideo }, composicion: { estrategia: 'cuadrado-centrado-en-lienzo-vertical', recorte, lienzo, filtro: detalleFiltro.pasos }, salida: { nombreExportado, extension: '.mp4', formato: config.video.formato, width: lienzo.anchoFinal, height: lienzo.altoFinal, fps: config.video.fps, nombreArchivoEdicion, rutaEdicion }, render: { rutaVideoEntrada: videoRender.ruta, origenVideoEntrada: videoRender.origen, usarAudioDelVideoRender: videoRender.usarAudioDelVideoRender, rutaAudioConSonidos: sonidos?.audioConSonidos || null, usarAudioConSonidos: Boolean(sonidos?.audioConSonidos && !sonidos?.omitido), filtroVideo: visualDinamico.filtroVideo, filtroVideoBase: detalleFiltro.filtroVideoBase || detalleFiltro.filtroVideo, animacionesRender: visualDinamico.animacionesRender || null, codecVideo: config.exportacion.codecVideo, codecAudio: config.exportacion.codecAudio, crf: config.exportacion.crf, presetFfmpeg: config.exportacion.presetFfmpeg, audioBitrate: config.exportacion.audioBitrate, pixFmt: config.exportacion.pixFmt }, transcripcion: { capasAplicadas: Boolean(capasTranscripcion.aplicadas), mensaje: capasTranscripcion.mensaje, capasVideo: capasTranscripcion.capasVideo, ajustadaPorEdicionDinamica: Boolean(edicionDinamica?.transcripcionAjustada) }, visualDinamico, sonidos, opciones: { plataforma: opciones?.plataforma || config.plataforma, modo: opciones?.modo || config.modo, mejorarAudio: opciones?.mejorarAudio ?? null, modoAudio: opciones?.modoAudio || null, crearTranscripcion: opciones?.crearTranscripcion ?? null, agregarSubtitulos: opciones?.agregarSubtitulos ?? null, agregarTextosFlotantes: opciones?.agregarTextosFlotantes ?? null, agregarSonidosEdicion: opciones?.agregarSonidosEdicion ?? null, agregarAnimacionesVisuales: opciones?.agregarAnimacionesVisuales ?? true, edicionDinamicaActiva: Boolean(edicionDinamica?.activo && !edicionDinamica?.omitido), motorEfectos: Boolean(visualDinamico?.motorEfectos && !visualDinamico.motorEfectos.omitido), animacionesRender: Boolean(visualDinamico?.animacionesRender && !visualDinamico.animacionesRender.omitido) }, auditoria: { moduloUsado: 'editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js', archivoEdicion: nombreArchivoEdicion, rutaEdicion, filtroVideo: visualDinamico.filtroVideo, filtroVideoBase: detalleFiltro.filtroVideoBase || detalleFiltro.filtroVideo, recorteResumen: recorte.explicacion, lienzoResumen: lienzo.resumen, capasTranscripcionAplicadas: Boolean(capasTranscripcion.aplicadas), visualDinamicoAplicado: Boolean(visualDinamico && !visualDinamico.omitido), motorEfectosAplicado: Boolean(visualDinamico?.motorEfectos && !visualDinamico.motorEfectos.omitido), animacionesRenderAplicadas: Boolean(visualDinamico?.animacionesRender && !visualDinamico.animacionesRender.omitido), totalAnimacionesRender: visualDinamico?.animacionesRender?.animaciones?.length || 0, sonidosAplicados: Boolean(sonidos && !sonidos.omitido), audioBaseSonidos: sonidos?.audioBase || null }, notas: crearNotasEdicion({ recorte, lienzo, capasTranscripcion, visualDinamico, sonidos, videoRender }), creadoEn: new Date().toISOString() };
}

export async function crearEdicionTikTokCuadradoCentro({ entrada, entendimiento, audio = null, transcripcion = null, edicionDinamica = null, opciones = {}, progreso = null } = {}) {
  validarEntradaServicio({ entrada, entendimiento });
  await reportarModulo(progreso, { etapa: 'editar', porcentaje: 77, titulo: 'Preparando formato cuadrado', detalle: 'Calculando recorte central y lienzo vertical.', archivo: 'editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js' });

  const config = obtenerConfigTikTokCuadradoCentro();
  const videoRender = seleccionarVideoRender(entrada, edicionDinamica);
  const transcripcionRender = seleccionarTranscripcionRender(transcripcion, edicionDinamica);
  const medidas = normalizarMedidasVideo({ entrada, entendimiento, config });
  const recorte = calcularRecorteCuadrado(medidas);
  const lienzo = calcularLienzoVertical({ config, recorte });

  await reportarModulo(progreso, { etapa: 'editar', porcentaje: 78, titulo: 'Recorte calculado', detalle: `Recorte ${recorte.anchoRecorte}x${recorte.altoRecorte} · lienzo ${lienzo.anchoFinal}x${lienzo.altoFinal}.`, datos: { recorte, lienzo }, archivo: 'editar/tiktok-cuadrado-centro/calcular-recorte-cuadrado.js' });

  const detalleFiltroBase = construirDetalleFiltroFfmpeg({ recorte, lienzo, medidas, config });
  const capasTranscripcion = aplicarCapasTranscripcion({ filtroBase: detalleFiltroBase.filtroVideo, transcripcion: transcripcionRender });

  await reportarModulo(progreso, { etapa: 'editar', porcentaje: 79, titulo: 'Capas de texto preparadas', detalle: capasTranscripcion.aplicadas ? 'Subtítulos/textos agregados al filtro.' : 'No se aplicaron capas de transcripción.', archivo: 'editar/comun/aplicar-capas-transcripcion.js' });

  const visualBase = await procesarVisualDinamico({ filtroBase: capasTranscripcion.filtroVideo, edicionDinamica, transcripcion: transcripcionRender, entendimiento, salida: { width: lienzo.anchoFinal, height: lienzo.altoFinal, fps: config.video.fps }, opciones, progreso });
  const motorEfectos = await procesarMotorEfectos({ filtroBase: visualBase.filtroVideo || capasTranscripcion.filtroVideo, entrada, entendimiento, transcripcion: transcripcionRender, edicionDinamica, salida: { width: lienzo.anchoFinal, height: lienzo.altoFinal, fps: config.video.fps }, opciones, progreso });
  const visualConMotor = combinarVisualConMotor(visualBase, motorEfectos);
  const visualDinamico = aplicarAnimacionesAVisual({ visualConMotor, entendimiento, transcripcionRender, edicionDinamica, lienzo, config, opciones });
  await reportarModulo(progreso, { etapa: 'editar', porcentaje: 86, titulo: 'Animaciones renderizadas', detalle: visualDinamico.animacionesRender?.mensaje || 'Animaciones preparadas.', datos: { animaciones: visualDinamico.animacionesRender?.animaciones?.length || 0, intensidad: visualDinamico.animacionesRender?.intensidad || null }, archivo: 'editar/animaciones/animaciones-render.service.js' });

  const sonidos = await procesarSonidosEdicion({ rutaVideoBase: videoRender.ruta, audio, visualDinamico, edicionDinamica, opciones, progreso });
  const detalleFiltro = { ...detalleFiltroBase, filtroVideo: visualDinamico.filtroVideo, filtroVideoBase: detalleFiltroBase.filtroVideo, capasTranscripcion, visualDinamico, motorEfectos, animacionesRender: visualDinamico.animacionesRender, sonidos };
  const nombreExportado = crearNombreExportadoTikTokCuadradoCentro({ entrada, config });
  const nombreArchivoEdicion = config.archivos?.nombreEdicion || 'edicion-tiktok-cuadrado-centro.json';
  const rutaEdicion = path.join(entrada.rutas.carpetaProyecto, nombreArchivoEdicion);
  const edicion = construirEdicion({ entrada, entendimiento, opciones: { ...opciones, plataforma: config.plataforma, modo: config.modo }, config, medidas, recorte, lienzo, detalleFiltro, capasTranscripcion, visualDinamico, sonidos, nombreExportado, rutaEdicion, nombreArchivoEdicion, videoRender, edicionDinamica });

  await escribirJson(rutaEdicion, edicion);
  await reportarModulo(progreso, { etapa: 'editar', porcentaje: 91, titulo: 'Edición cuadrada lista', detalle: `Visuales: ${visualDinamico.omitido ? 'no' : 'sí'} · animaciones: ${visualDinamico.animacionesRender?.animaciones?.length || 0} · motor: ${motorEfectos?.omitido ? 'no' : 'sí'} · audio/sonidos: ${sonidos?.omitido ? 'no' : 'sí'}.`, archivo: 'editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js' });

  return { ...edicion, rutaEdicion };
}
