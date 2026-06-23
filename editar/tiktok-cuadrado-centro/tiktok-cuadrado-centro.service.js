import path from 'path';
import { escribirJson } from '../../comun/archivos.js';

import { obtenerConfigTikTokCuadradoCentro } from './tiktok-cuadrado-centro.config.js';
import { normalizarMedidasVideo } from './normalizar-medidas-video.js';
import { calcularRecorteCuadrado } from './calcular-recorte-cuadrado.js';
import { calcularLienzoVertical } from './calcular-lienzo-vertical.js';
import { construirDetalleFiltroFfmpeg } from './construir-filtro-ffmpeg.js';
import { crearNombreExportadoTikTokCuadradoCentro } from './crear-nombre-exportado.js';
import { aplicarCapasTranscripcion } from '../comun/aplicar-capas-transcripcion.js';

function validarEntradaServicio({ entrada, entendimiento }) {
  if (!entrada || typeof entrada !== 'object') throw new Error('No se puede crear la edición cuadrado centro porque falta la entrada.');
  if (!entrada?.video?.rutaOriginal) throw new Error('No se puede crear la edición cuadrado centro porque falta la ruta del video original.');
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede crear la edición cuadrado centro porque falta la carpeta del proyecto.');
  if (!entrada?.proyecto?.id) throw new Error('No se puede crear la edición cuadrado centro porque falta el ID del proyecto.');
  if (!entendimiento || typeof entendimiento !== 'object') throw new Error('No se puede crear la edición cuadrado centro porque falta el entendimiento del video.');
  if (entendimiento.ok !== true) throw new Error('No se puede crear la edición cuadrado centro porque el análisis no terminó correctamente.');
}

function crearNotasEdicion({ recorte, lienzo, capasTranscripcion }) {
  const notas = ['Preset TikTok cuadrado centro.', 'El video se recorta en cuadrado usando el centro geométrico del video original.', `Recorte aplicado: ${recorte.anchoRecorte}x${recorte.altoRecorte} desde x=${recorte.x}, y=${recorte.y}.`, `Franjas negras: ${lienzo.franjaSuperior}px arriba y ${lienzo.franjaInferior}px abajo.`, 'El contenido cuadrado se escala a 1080x1080.', 'La salida final es 1080x1920.', 'Este preset evita el zoom vertical agresivo del modo simple.'];
  if (capasTranscripcion?.aplicadas) notas.push('Se aplicaron subtítulos y/o textos flotantes desde el módulo transcripcion/.');
  return notas;
}

function construirEdicion({ entrada, entendimiento, opciones, config, medidas, recorte, lienzo, detalleFiltro, capasTranscripcion, nombreExportado, rutaEdicion, nombreArchivoEdicion }) {
  return { ok: true, etapa: 'editar', tipo: config.nombre, plataforma: config.plataforma, modo: config.modo, preset: { nombre: config.nombre, version: config.version, descripcion: config.descripcion, video: config.video, recorte: config.recorte, exportacion: config.exportacion }, entrada: { rutaVideoOriginal: entrada.video.rutaOriginal, nombreOriginal: entrada.video.nombreOriginal || null, nombreSeguro: entrada.video.nombreSeguro || null, orientacionDetectada: medidas.orientacionDetectada, medidasOriginales: { width: medidas.anchoOriginal, height: medidas.altoOriginal, fps: medidas.fps, duracionSegundos: medidas.duracionSegundos, relacionAspectoOriginal: medidas.relacionAspectoOriginal }, tieneAudio: medidas.tieneAudio, tieneVideo: medidas.tieneVideo }, composicion: { estrategia: 'cuadrado-centrado-en-lienzo-vertical', recorte, lienzo, filtro: detalleFiltro.pasos }, salida: { nombreExportado, extension: '.mp4', formato: config.video.formato, width: lienzo.anchoFinal, height: lienzo.altoFinal, fps: config.video.fps, nombreArchivoEdicion, rutaEdicion }, render: { filtroVideo: capasTranscripcion.filtroVideo, filtroVideoBase: detalleFiltro.filtroVideoBase || detalleFiltro.filtroVideo, codecVideo: config.exportacion.codecVideo, codecAudio: config.exportacion.codecAudio, crf: config.exportacion.crf, presetFfmpeg: config.exportacion.presetFfmpeg, audioBitrate: config.exportacion.audioBitrate, pixFmt: config.exportacion.pixFmt }, transcripcion: { capasAplicadas: Boolean(capasTranscripcion.aplicadas), mensaje: capasTranscripcion.mensaje, capasVideo: capasTranscripcion.capasVideo }, opciones: { plataforma: opciones?.plataforma || config.plataforma, modo: opciones?.modo || config.modo, mejorarAudio: opciones?.mejorarAudio ?? null, modoAudio: opciones?.modoAudio || null, crearTranscripcion: opciones?.crearTranscripcion ?? null, agregarSubtitulos: opciones?.agregarSubtitulos ?? null, agregarTextosFlotantes: opciones?.agregarTextosFlotantes ?? null }, auditoria: { moduloUsado: 'editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js', archivoEdicion: nombreArchivoEdicion, rutaEdicion, filtroVideo: capasTranscripcion.filtroVideo, filtroVideoBase: detalleFiltro.filtroVideoBase || detalleFiltro.filtroVideo, recorteResumen: recorte.explicacion, lienzoResumen: lienzo.resumen, capasTranscripcionAplicadas: Boolean(capasTranscripcion.aplicadas) }, notas: crearNotasEdicion({ recorte, lienzo, capasTranscripcion }), creadoEn: new Date().toISOString() };
}

export async function crearEdicionTikTokCuadradoCentro({ entrada, entendimiento, audio = null, transcripcion = null, opciones = {} } = {}) {
  validarEntradaServicio({ entrada, entendimiento });
  const config = obtenerConfigTikTokCuadradoCentro();
  const medidas = normalizarMedidasVideo({ entrada, entendimiento, config });
  const recorte = calcularRecorteCuadrado(medidas);
  const lienzo = calcularLienzoVertical({ config, recorte });
  const detalleFiltroBase = construirDetalleFiltroFfmpeg({ recorte, lienzo, medidas, config });
  const capasTranscripcion = aplicarCapasTranscripcion({ filtroBase: detalleFiltroBase.filtroVideo, transcripcion });
  const detalleFiltro = { ...detalleFiltroBase, filtroVideo: capasTranscripcion.filtroVideo, filtroVideoBase: detalleFiltroBase.filtroVideo, capasTranscripcion };
  const nombreExportado = crearNombreExportadoTikTokCuadradoCentro({ entrada, config });
  const nombreArchivoEdicion = config.archivos?.nombreEdicion || 'edicion-tiktok-cuadrado-centro.json';
  const rutaEdicion = path.join(entrada.rutas.carpetaProyecto, nombreArchivoEdicion);
  const edicion = construirEdicion({ entrada, entendimiento, opciones: { ...opciones, plataforma: config.plataforma, modo: config.modo }, config, medidas, recorte, lienzo, detalleFiltro, capasTranscripcion, nombreExportado, rutaEdicion, nombreArchivoEdicion });
  await escribirJson(rutaEdicion, edicion);
  return { ...edicion, rutaEdicion };
}
