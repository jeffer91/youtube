import fs from 'fs';
import path from 'path';
import { escribirJson } from '../../comun/archivos.js';
import { obtenerConfigTranscripcion } from '../transcripcion.config.js';

function validarCarpetaProyecto(entrada) {
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede guardar la transcripción porque falta la carpeta del proyecto.');
  return entrada.rutas.carpetaProyecto;
}

async function escribirTexto(rutaArchivo, contenido) {
  await fs.promises.mkdir(path.dirname(rutaArchivo), { recursive: true });
  await fs.promises.writeFile(rutaArchivo, contenido || '', 'utf-8');
  return rutaArchivo;
}

export async function guardarArchivosTranscripcion({ entrada, transcripcion, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const carpetaProyecto = validarCarpetaProyecto(entrada);
  const rutaJson = path.join(carpetaProyecto, config.archivos.transcripcionJson);
  const rutaTxt = path.join(carpetaProyecto, config.archivos.transcripcionTxt);
  const payload = { ok: Boolean(transcripcion?.ok), etapa: 'transcripcion', idioma: transcripcion?.idioma || config.transcripcion.idioma, fuente: transcripcion?.fuente || null, omitido: Boolean(transcripcion?.omitido), mensaje: transcripcion?.mensaje || null, textoCompleto: transcripcion?.textoCompleto || '', segmentos: Array.isArray(transcripcion?.segmentos) ? transcripcion.segmentos : [], cantidadSegmentos: transcripcion?.cantidadSegmentos || 0, fuenteAudio: transcripcion?.fuenteAudio || null, proyectoId: entrada?.proyecto?.id || null, creadoEn: new Date().toISOString() };
  await escribirJson(rutaJson, payload);
  await escribirTexto(rutaTxt, payload.textoCompleto);
  return { ok: true, transcripcion: { json: { ruta: rutaJson, nombre: path.basename(rutaJson) }, txt: { ruta: rutaTxt, nombre: path.basename(rutaTxt) } }, creadoEn: new Date().toISOString() };
}

export default guardarArchivosTranscripcion;
