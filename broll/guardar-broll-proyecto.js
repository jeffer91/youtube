import path from 'path';
import { escribirJson } from '../comun/archivos.js';
import { obtenerConfigBroll } from './broll.config.js';

function obtenerCarpetaProyecto(entrada = {}) {
  return entrada?.rutas?.carpetaProyecto || entrada?.rutas?.proyecto || entrada?.proyecto?.carpetaProyecto || null;
}

export async function guardarBrollProyecto({ entrada = null, broll = null, opciones = {} } = {}) {
  const config = obtenerConfigBroll(opciones);
  const carpeta = obtenerCarpetaProyecto(entrada || {});
  if (!carpeta) {
    return { ok: false, omitido: true, motivo: 'No hay carpeta de proyecto para guardar B-Roll sugerido.' };
  }

  const rutaBroll = path.join(carpeta, config.archivoSugerencias);
  await escribirJson(rutaBroll, broll || { ok: false, items: [] });
  return {
    ok: true,
    rutaBroll,
    nombreArchivo: path.basename(rutaBroll)
  };
}

export default guardarBrollProyecto;
