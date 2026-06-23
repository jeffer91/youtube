export const SONIDOS_EDICION = Object.freeze({
  POP: 'pop',
  CLICK: 'click',
  WHOOSH: 'whoosh',
  HIT: 'hit',
  INTRO: 'intro',
  OUTRO: 'outro'
});

export const CONFIG_SONIDOS_EDICION = Object.freeze({
  volumenPredeterminado: 0.24,
  volumenMaximo: 0.48,
  separacionMinimaSegundos: 1.2,
  cantidadMaximaEventos: 16,
  carpetaGenerados: 'generados',
  nombreAudioFinal: 'audio-con-sonidos-edicion.m4a',
  sonidosBase: {
    pop: { frecuencia: 920, duracion: 0.075, volumen: 0.22 },
    click: { frecuencia: 1350, duracion: 0.045, volumen: 0.18 },
    whoosh: { frecuencia: 520, duracion: 0.18, volumen: 0.16 },
    hit: { frecuencia: 190, duracion: 0.11, volumen: 0.24 },
    intro: { frecuencia: 700, duracion: 0.22, volumen: 0.2 },
    outro: { frecuencia: 420, duracion: 0.25, volumen: 0.18 }
  }
});

export function numeroSeguro(valor, respaldo = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : respaldo;
}

export function limitarNumero(valor, minimo, maximo, respaldo) {
  const numero = numeroSeguro(valor, respaldo);
  return Math.min(maximo, Math.max(minimo, numero));
}

export function normalizarBooleano(valor, respaldo = false) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo'].includes(limpio)) return false;
  }
  return respaldo;
}

export function obtenerConfigSonidosEdicion(opciones = {}) {
  const activo = normalizarBooleano(opciones.agregarSonidosEdicion ?? opciones.sonidosEdicion ?? opciones.efectosSonido, true);
  const volumen = limitarNumero(opciones.volumenSonidosEdicion, 0.04, CONFIG_SONIDOS_EDICION.volumenMaximo, CONFIG_SONIDOS_EDICION.volumenPredeterminado);
  const separacionMinimaSegundos = limitarNumero(opciones.separacionMinimaSonidos, 0.5, 4, CONFIG_SONIDOS_EDICION.separacionMinimaSegundos);
  const cantidadMaximaEventos = Math.round(limitarNumero(opciones.cantidadMaximaSonidos, 1, 32, CONFIG_SONIDOS_EDICION.cantidadMaximaEventos));
  const modo = String(opciones.modoSonidosEdicion || 'normal').trim().toLowerCase();

  return {
    activo,
    modo,
    volumen,
    separacionMinimaSegundos,
    cantidadMaximaEventos,
    volumenMaximo: CONFIG_SONIDOS_EDICION.volumenMaximo,
    carpetaGenerados: CONFIG_SONIDOS_EDICION.carpetaGenerados,
    nombreAudioFinal: CONFIG_SONIDOS_EDICION.nombreAudioFinal,
    sonidosBase: CONFIG_SONIDOS_EDICION.sonidosBase
  };
}

export default obtenerConfigSonidosEdicion;
