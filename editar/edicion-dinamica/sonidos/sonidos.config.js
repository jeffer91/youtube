export const SONIDOS_EDICION = Object.freeze({
  POP: 'pop',
  CLICK: 'click',
  WHOOSH: 'whoosh',
  HIT: 'hit',
  RISER: 'riser',
  NOTIFICATION: 'notification',
  BEEP: 'beep',
  INTRO: 'intro',
  OUTRO: 'outro'
});

export const CONFIG_SONIDOS_EDICION = Object.freeze({
  volumenPredeterminado: 0.11,
  volumenMaximo: 0.22,
  separacionMinimaSegundos: 1.8,
  inicioSeguroSegundos: 0.9,
  cantidadMaximaEventos: 10,
  carpetaGenerados: 'generados',
  nombreAudioFinal: 'audio-con-sonidos-edicion.m4a',
  sonidosBase: {
    pop: { frecuencia: 840, duracion: 0.055, volumen: 0.09 },
    click: { frecuencia: 1180, duracion: 0.035, volumen: 0.08 },
    whoosh: { frecuencia: 460, duracion: 0.14, volumen: 0.075 },
    hit: { frecuencia: 170, duracion: 0.08, volumen: 0.09 },
    riser: { frecuencia: 680, duracion: 0.34, volumen: 0.072 },
    notification: { frecuencia: 980, duracion: 0.10, volumen: 0.075 },
    beep: { frecuencia: 760, duracion: 0.12, volumen: 0.07 },
    intro: { frecuencia: 620, duracion: 0.14, volumen: 0.075 },
    outro: { frecuencia: 380, duracion: 0.16, volumen: 0.075 }
  }
});

export function numeroSeguro(valor, respaldo = 0) { const numero = Number(valor); return Number.isFinite(numero) ? numero : respaldo; }
export function limitarNumero(valor, minimo, maximo, respaldo) { const numero = numeroSeguro(valor, respaldo); return Math.min(maximo, Math.max(minimo, numero)); }
export function normalizarBooleano(valor, respaldo = false) { if (typeof valor === 'boolean') return valor; if (typeof valor === 'number') return valor === 1; if (typeof valor === 'string') { const limpio = valor.trim().toLowerCase(); if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo'].includes(limpio)) return true; if (['false', '0', 'no', 'off', 'inactivo'].includes(limpio)) return false; } return respaldo; }

export function obtenerConfigSonidosEdicion(opciones = {}) {
  const activo = normalizarBooleano(opciones.agregarSonidosEdicion ?? opciones.sonidosEdicion ?? opciones.efectosSonido, true);
  const modo = String(opciones.modoSonidosEdicion || 'seguro').trim().toLowerCase();
  const volumenBase = modo === 'fuerte' ? 0.18 : modo === 'normal' ? 0.13 : CONFIG_SONIDOS_EDICION.volumenPredeterminado;
  const volumenMaximo = modo === 'fuerte' ? 0.3 : CONFIG_SONIDOS_EDICION.volumenMaximo;
  const volumen = limitarNumero(opciones.volumenSonidosEdicion, 0.03, volumenMaximo, volumenBase);
  const separacionMinimaSegundos = limitarNumero(opciones.separacionMinimaSonidos, 0.8, 5, CONFIG_SONIDOS_EDICION.separacionMinimaSegundos);
  const inicioSeguroSegundos = limitarNumero(opciones.inicioSeguroSonidos, 0.6, 2.5, CONFIG_SONIDOS_EDICION.inicioSeguroSegundos);
  const cantidadMaximaEventos = Math.round(limitarNumero(opciones.cantidadMaximaSonidos, 1, 24, CONFIG_SONIDOS_EDICION.cantidadMaximaEventos));
  return { activo, modo, volumen, separacionMinimaSegundos, inicioSeguroSegundos, cantidadMaximaEventos, volumenMaximo, carpetaGenerados: CONFIG_SONIDOS_EDICION.carpetaGenerados, nombreAudioFinal: CONFIG_SONIDOS_EDICION.nombreAudioFinal, sonidosBase: CONFIG_SONIDOS_EDICION.sonidosBase };
}

export default obtenerConfigSonidosEdicion;
