import path from 'path';
import { escribirJson } from '../../comun/archivos.js';
import { obtenerConfigTranscripcion } from '../transcripcion.config.js';
import { normalizarTextosFlotantes } from './normalizar-textos-flotantes.js';

function validarCarpetaProyecto(entrada) {
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se pueden generar textos flotantes porque falta la carpeta del proyecto.');
  return entrada.rutas.carpetaProyecto;
}

function resultadoOmitido(mensaje) {
  return { ok: true, omitido: true, mensaje, textos: [], cantidad: 0, rutaTextosFlotantes: null, creadoEn: new Date().toISOString() };
}

function obtenerMomentos(origenMomentos) {
  if (Array.isArray(origenMomentos)) return origenMomentos;
  if (Array.isArray(origenMomentos?.momentosImportantes)) return origenMomentos.momentosImportantes;
  if (Array.isArray(origenMomentos?.textosFlotantes)) return origenMomentos.textosFlotantes;
  return [];
}

export async function generarTextosFlotantes({ entrada, origenMomentos, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const carpetaProyecto = validarCarpetaProyecto(entrada);
  if (!config.textosFlotantes.agregarTextosFlotantes) return resultadoOmitido('Los textos flotantes están desactivados por opciones.');
  const momentos = obtenerMomentos(origenMomentos);
  const textos = normalizarTextosFlotantes(momentos, opciones);
  if (textos.length === 0) return resultadoOmitido('No existen momentos importantes para generar textos flotantes.');
  const rutaTextosFlotantes = path.join(carpetaProyecto, config.archivos.textosFlotantes);
  const payload = { ok: true, tipo: 'textos-flotantes', cantidad: textos.length, textos, origen: origenMomentos?.origen || 'desconocido', creadoEn: new Date().toISOString() };
  await escribirJson(rutaTextosFlotantes, payload);
  return { ok: true, omitido: false, mensaje: 'Textos flotantes generados correctamente.', textos, cantidad: textos.length, rutaTextosFlotantes, nombreArchivo: path.basename(rutaTextosFlotantes), creadoEn: new Date().toISOString() };
}

export default generarTextosFlotantes;
