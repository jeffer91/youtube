import path from 'path';
import { escribirJson } from '../../comun/archivos.js';
import { obtenerConfigTranscripcion } from '../transcripcion.config.js';
import { envolverRutaFiltro } from './escapar-ruta-ffmpeg.js';
import { construirDrawtextsFfmpeg } from '../textos-flotantes/construir-drawtext-ffmpeg.js';

function validarCarpetaProyecto(entrada) {
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se pueden construir capas porque falta la carpeta del proyecto.');
  return entrada.rutas.carpetaProyecto;
}

function crearFiltroSubtitulos(subtitulos) {
  const rutaAss = subtitulos?.ass?.ruta;
  if (!rutaAss) return null;
  return `subtitles=${envolverRutaFiltro(rutaAss)}`;
}

function crearResultadoOmitido(mensaje) {
  return { ok: true, omitido: true, mensaje, usarSubtitulos: false, usarTextosFlotantes: false, filtroSubtitulos: null, filtrosTextosFlotantes: [], filtroCapasFinal: '', rutaCapasVideo: null, creadoEn: new Date().toISOString() };
}

export async function construirCapasVideo({ entrada, subtitulos = null, textosFlotantes = null, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const carpetaProyecto = validarCarpetaProyecto(entrada);
  const usarSubtitulos = Boolean(config.subtitulos.agregarSubtitulos && subtitulos?.ok && !subtitulos?.omitido && subtitulos?.ass?.ruta);
  const usarTextosFlotantes = Boolean(config.textosFlotantes.agregarTextosFlotantes && textosFlotantes?.ok && !textosFlotantes?.omitido && Array.isArray(textosFlotantes?.textos) && textosFlotantes.textos.length > 0);
  if (!usarSubtitulos && !usarTextosFlotantes) return crearResultadoOmitido('No hay subtítulos ni textos flotantes para aplicar.');
  const filtroSubtitulos = usarSubtitulos ? crearFiltroSubtitulos(subtitulos) : null;
  const drawtexts = usarTextosFlotantes ? construirDrawtextsFfmpeg(textosFlotantes.textos, opciones) : [];
  const filtrosTextosFlotantes = drawtexts.map((item) => item.filtro);
  const filtrosFinales = [filtroSubtitulos, ...filtrosTextosFlotantes].filter(Boolean);
  const rutaCapasVideo = path.join(carpetaProyecto, config.archivos.capasVideo);
  const payload = { ok: true, omitido: false, tipo: 'capas-video-transcripcion', usarSubtitulos, usarTextosFlotantes, filtroSubtitulos, filtrosTextosFlotantes, filtroCapasFinal: filtrosFinales.join(','), drawtexts, archivos: { subtitulosAss: subtitulos?.ass?.ruta || null, textosFlotantes: textosFlotantes?.rutaTextosFlotantes || null }, creadoEn: new Date().toISOString() };
  await escribirJson(rutaCapasVideo, payload);
  return { ...payload, rutaCapasVideo, nombreArchivo: path.basename(rutaCapasVideo) };
}

export default construirCapasVideo;
