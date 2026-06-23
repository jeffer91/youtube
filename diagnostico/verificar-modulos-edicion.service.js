import path from 'path';
import { pathToFileURL } from 'url';
import { obtenerRutaProyecto } from '../comun/archivos.js';
import { DIAGNOSTICO_AUTOMATICO_CONFIG } from './diagnostico-automatico.config.js';

async function verificarModulo(rutaRelativa) {
  const rutaAbsoluta = path.join(obtenerRutaProyecto(), rutaRelativa);
  try {
    const modulo = await import(pathToFileURL(rutaAbsoluta).href);
    const exportaciones = Object.keys(modulo || {});
    return {
      ok: true,
      ruta: rutaRelativa,
      exportaciones,
      errores: [],
      advertencias: exportaciones.length === 0 ? ['El módulo no expone exportaciones.'] : []
    };
  } catch (error) {
    return {
      ok: false,
      ruta: rutaRelativa,
      exportaciones: [],
      errores: [`${rutaRelativa}: ${error.message}`],
      advertencias: []
    };
  }
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
    mensaje: errores.length === 0 ? 'Módulos críticos cargan correctamente.' : `Hay módulos críticos con errores: ${errores.join(' ')}`,
    creadoEn: new Date().toISOString()
  };
}

export default verificarModulosEdicionDiagnostico;
