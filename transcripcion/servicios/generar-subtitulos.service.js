import fs from 'fs';
import path from 'path';
import { TRANSCRIPCION_CONFIG, obtenerConfigTranscripcion } from '../transcripcion.config.js';
import { generarContenidoSrt, crearResumenSrt } from './generar-srt-subtitulos.js';
import { generarContenidoAss, crearResumenAss } from './generar-ass-subtitulos.js';
import { normalizarSegmentos } from './normalizar-segmentos.js';

function validarCarpetaProyecto(entrada) {
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('Falta carpeta del proyecto para subtítulos.');
  return entrada.rutas.carpetaProyecto;
}

async function escribirTexto(rutaArchivo, contenido) {
  await fs.promises.mkdir(path.dirname(rutaArchivo), { recursive: true });
  await fs.promises.writeFile(rutaArchivo, contenido, 'utf-8');
  return rutaArchivo;
}

function resultadoOmitido(mensaje) {
  return { ok: true, omitido: true, mensaje, srt: null, ass: null, segmentosUsados: 0, creadoEn: new Date().toISOString() };
}

export async function generarSubtitulos({ entrada, transcripcion, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const carpetaProyecto = validarCarpetaProyecto(entrada);
  if (!config.subtitulos.agregarSubtitulos) return resultadoOmitido('Subtítulos desactivados.');
  const segmentos = normalizarSegmentos(transcripcion?.segmentos || [], { config });
  if (segmentos.length === 0) return resultadoOmitido('No hay segmentos para subtítulos.');
  const rutaSrt = path.join(carpetaProyecto, config.archivos.subtitulosSrt || TRANSCRIPCION_CONFIG.archivos.subtitulosSrt);
  const rutaAss = path.join(carpetaProyecto, config.archivos.subtitulosAss || TRANSCRIPCION_CONFIG.archivos.subtitulosAss);
  let srt = null;
  let ass = null;
  if (config.subtitulos.generarSrt) {
    await escribirTexto(rutaSrt, generarContenidoSrt(segmentos, { config }));
    srt = { nombre: path.basename(rutaSrt), ruta: rutaSrt, resumen: crearResumenSrt(segmentos) };
  }
  if (config.subtitulos.generarAss) {
    await escribirTexto(rutaAss, generarContenidoAss(segmentos, { config, estilo: config.subtitulos.estilo }));
    ass = { nombre: path.basename(rutaAss), ruta: rutaAss, resumen: crearResumenAss(segmentos, { estilo: config.subtitulos.estilo }) };
  }
  return { ok: true, omitido: false, mensaje: 'Subtítulos generados correctamente.', srt, ass, segmentosUsados: segmentos.length, estilo: config.subtitulos.estilo, creadoEn: new Date().toISOString() };
}

export default generarSubtitulos;
