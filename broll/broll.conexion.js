import { obtenerConfigBroll, BROLL_CONFIG, BROLL_VERSION } from './broll.config.js';
import { sugerirBrollLocal } from './sugerir-broll.service.js';
import { guardarBrollProyecto } from './guardar-broll-proyecto.js';

export async function procesarBrollSugerido({ entrada = null, entendimiento = null, transcripcion = null, inteligencia = null, opciones = {}, guardar = true } = {}) {
  const config = obtenerConfigBroll(opciones);
  const broll = sugerirBrollLocal({ inteligencia, transcripcion, entendimiento, opciones });
  const guardado = guardar && broll.ok && !broll.omitido
    ? await guardarBrollProyecto({ entrada, broll, opciones })
    : null;

  return {
    ...broll,
    tipo: 'broll-sugerido',
    version: BROLL_VERSION,
    guardado
  };
}

export {
  obtenerConfigBroll,
  BROLL_CONFIG,
  BROLL_VERSION,
  sugerirBrollLocal,
  guardarBrollProyecto
};

export default {
  procesarBrollSugerido,
  obtenerConfigBroll,
  sugerirBrollLocal,
  guardarBrollProyecto
};
