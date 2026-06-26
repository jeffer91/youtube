import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { obtenerRutaProyecto } from '../comun/archivos.js';
import { DIAGNOSTICO_AUTOMATICO_CONFIG } from './diagnostico-automatico.config.js';

function esModuloJavascript(rutaRelativa) {
  return ['.js', '.mjs'].includes(path.extname(rutaRelativa).toLowerCase());
}

async function verificarArchivoEstatico(rutaRelativa, rutaAbsoluta) {
  const existe = fs.existsSync(rutaAbsoluta);
  return {
    ok: existe,
    ruta: rutaRelativa,
    tipo: 'archivo-estatico',
    exportaciones: [],
    errores: existe ? [] : [`${rutaRelativa}: archivo no encontrado`],
    advertencias: []
  };
}

async function verificarModuloJavascript(rutaRelativa, rutaAbsoluta) {
  try {
    const modulo = await import(pathToFileURL(rutaAbsoluta).href);
    const exportaciones = Object.keys(modulo || {});
    return {
      ok: true,
      ruta: rutaRelativa,
      tipo: 'modulo-js',
      exportaciones,
      errores: [],
      advertencias: exportaciones.length === 0 ? ['El módulo no expone exportaciones.'] : []
    };
  } catch (error) {
    return {
      ok: false,
      ruta: rutaRelativa,
      tipo: 'modulo-js',
      exportaciones: [],
      errores: [`${rutaRelativa}: ${error.message}`],
      advertencias: []
    };
  }
}

async function verificarModulo(rutaRelativa) {
  const rutaAbsoluta = path.join(obtenerRutaProyecto(), rutaRelativa);
  if (!esModuloJavascript(rutaRelativa)) {
    return await verificarArchivoEstatico(rutaRelativa, rutaAbsoluta);
  }
  return await verificarModuloJavascript(rutaRelativa, rutaAbsoluta);
}

export async function verificarModulosEdicionDiagnostico({ modulos = DIAGNOSTICO_AUTOMATICO_CONFIG.modulosCriticos } = {}) {
  const verificaciones = [];

  for (const modulo of modulos) {
    verificaciones.push(await verificarModulo(modulo));
  }

  const errores = verificaciones.flatMap((item) => item.errores);
  const advertencias = verificaciones.flatMap((item) => item.advertencias.map((advertencia) => `${item.ruta}: ${advertencia}`));

  return {
    ok: errores.length === 0,
    bloqueante: errores.length > 0,
    etapa: 'diagnostico-modulos-edicion',
    verificaciones,
    errores,
    advertencias,
    mensaje: errores.length === 0 ? 'Módulos y archivos críticos cargan correctamente.' : `Hay módulos o archivos críticos con errores: ${errores.join(' ')}`,
    creadoEn: new Date().toISOString()
  };
}

export default verificarModulosEdicionDiagnostico;
