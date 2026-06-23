import fs from 'fs';
import path from 'path';
import { generarContenidoSrt, crearResumenSrt } from '../../../transcripcion/servicios/generar-srt-subtitulos.js';
import { generarContenidoAss, crearResumenAss } from '../../../transcripcion/servicios/generar-ass-subtitulos.js';

async function escribirTexto(rutaArchivo, contenido) {
  await fs.promises.mkdir(path.dirname(rutaArchivo), { recursive: true });
  await fs.promises.writeFile(rutaArchivo, contenido, 'utf-8');
  return rutaArchivo;
}

export async function ajustarSubtitulosDinamicos({ subtitulos = null, segmentosAjustados = [], carpetaTiempo, opciones = {} } = {}) {
  if (!Array.isArray(segmentosAjustados) || segmentosAjustados.length === 0) {
    return {
      ok: true,
      omitido: true,
      mensaje: 'No se generaron subtítulos ajustados porque no hay segmentos ajustados.',
      srt: null,
      ass: null,
      segmentosUsados: 0,
      creadoEn: new Date().toISOString()
    };
  }

  const carpetaSubtitulos = path.join(carpetaTiempo, 'subtitulos-ajustados');
  const rutaSrt = path.join(carpetaSubtitulos, 'subtitulos-ajustados.srt');
  const rutaAss = path.join(carpetaSubtitulos, 'subtitulos-ajustados.ass');

  const generarSrt = subtitulos?.srt !== null;
  const generarAss = subtitulos?.ass !== null;

  let srt = null;
  let ass = null;

  if (generarSrt) {
    await escribirTexto(rutaSrt, generarContenidoSrt(segmentosAjustados, opciones));
    srt = {
      nombre: path.basename(rutaSrt),
      ruta: rutaSrt,
      resumen: crearResumenSrt(segmentosAjustados)
    };
  }

  if (generarAss) {
    await escribirTexto(rutaAss, generarContenidoAss(segmentosAjustados, opciones));
    ass = {
      nombre: path.basename(rutaAss),
      ruta: rutaAss,
      resumen: crearResumenAss(segmentosAjustados, opciones)
    };
  }

  return {
    ok: true,
    omitido: false,
    mensaje: 'Subtítulos ajustados al video sin silencios.',
    srt,
    ass,
    segmentosUsados: segmentosAjustados.length,
    origen: 'edicion-dinamica',
    creadoEn: new Date().toISOString()
  };
}

export default ajustarSubtitulosDinamicos;
