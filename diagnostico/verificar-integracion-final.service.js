import path from 'path';
import { pathToFileURL } from 'url';
import { obtenerRutaProyecto } from '../comun/archivos.js';

const ARCHIVOS_INTEGRACION_FINAL = Object.freeze([
  'server.js',
  'motor/motor.conexion.js',
  'motor/flujo-principal.js',
  'editar/editar.conexion.js',
  'editar/edicion-dinamica/edicion-dinamica.config.js',
  'editar/edicion-dinamica/edicion-dinamica.conexion.js',
  'editar/edicion-dinamica/cortes/cortes.conexion.js',
  'editar/edicion-dinamica/cortes/aplicar-cortes-video.service.js',
  'editar/edicion-dinamica/tiempo/crear-mapa-tiempo.js',
  'editar/edicion-dinamica/tiempo/tiempo.conexion.js',
  'editar/edicion-dinamica/visual/visual.conexion.js',
  'editar/edicion-dinamica/sonidos/sonidos.conexion.js',
  'salida/salida.conexion.js',
  'salida/exportar-simple/exportar.service.js',
  'diagnostico/diagnostico-automatico.service.js',
  'diagnostico/verificar-progreso-real.service.js',
  'progreso/progreso.config.js',
  'progreso/progreso-eventos.js',
  'progreso/progreso-registro.js',
  'progreso/progreso.conexion.js',
  'progreso/progreso-modulo.js'
]);

async function importarArchivo(rutaRelativa) {
  const rutaAbsoluta = path.join(obtenerRutaProyecto(), rutaRelativa);
  try {
    const modulo = await import(pathToFileURL(rutaAbsoluta).href);
    return { ok: true, ruta: rutaRelativa, exportaciones: Object.keys(modulo || {}), error: null };
  } catch (error) {
    return { ok: false, ruta: rutaRelativa, exportaciones: [], error: error.message };
  }
}

export async function verificarIntegracionFinal({ archivos = ARCHIVOS_INTEGRACION_FINAL } = {}) {
  const verificaciones = [];

  for (const archivo of archivos) {
    verificaciones.push(await importarArchivo(archivo));
  }

  const errores = verificaciones.filter((item) => !item.ok).map((item) => `${item.ruta}: ${item.error}`);
  const advertencias = verificaciones.filter((item) => item.ok && item.exportaciones.length === 0).map((item) => `${item.ruta}: sin exportaciones visibles`);

  return { ok: errores.length === 0, tipo: 'verificacion-integracion-final', archivosRevisados: archivos.length, errores, advertencias, verificaciones, mensaje: errores.length === 0 ? 'Integración final cargó correctamente.' : `Integración final con errores: ${errores.join(' ')}`, creadoEn: new Date().toISOString() };
}

export default verificarIntegracionFinal;
