export const INTENSIDADES_EDICION_DINAMICA = Object.freeze({ SUAVE: 'suave', NORMAL: 'normal', AGRESIVA: 'agresiva', CLASE: 'clase', TIKTOK: 'tiktok', AUTOMATICA: 'automatica' });

export const CONFIG_INTENSIDADES = Object.freeze({
  suave: { ruidoDb: -36, silencioMinimoSegundos: 0.75, margenAntesFrase: 0.16, margenDespuesFrase: 0.22, duracionMinimaSegmento: 1.1, maximoCortes: 70, porcentajeMaximoEliminacion: 0.35 },
  normal: { ruidoDb: -34, silencioMinimoSegundos: 0.45, margenAntesFrase: 0.12, margenDespuesFrase: 0.18, duracionMinimaSegmento: 0.85, maximoCortes: 130, porcentajeMaximoEliminacion: 0.45 },
  agresiva: { ruidoDb: -32, silencioMinimoSegundos: 0.28, margenAntesFrase: 0.08, margenDespuesFrase: 0.12, duracionMinimaSegmento: 0.55, maximoCortes: 180, porcentajeMaximoEliminacion: 0.55 },
  clase: { ruidoDb: -37, silencioMinimoSegundos: 0.9, margenAntesFrase: 0.2, margenDespuesFrase: 0.28, duracionMinimaSegmento: 1.25, maximoCortes: 60, porcentajeMaximoEliminacion: 0.3 },
  tiktok: { ruidoDb: -33, silencioMinimoSegundos: 0.35, margenAntesFrase: 0.1, margenDespuesFrase: 0.14, duracionMinimaSegmento: 0.7, maximoCortes: 160, porcentajeMaximoEliminacion: 0.5 },
  automatica: { ruidoDb: -34, silencioMinimoSegundos: 0.45, margenAntesFrase: 0.12, margenDespuesFrase: 0.18, duracionMinimaSegmento: 0.85, maximoCortes: 130, porcentajeMaximoEliminacion: 0.45 }
});

export function normalizarTexto(valor, valorPorDefecto = '') {
  if (typeof valor !== 'string') return valorPorDefecto;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : valorPorDefecto;
}

export function normalizarBooleano(valor, valorPorDefecto = false) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }
  return valorPorDefecto;
}

export function limitarNumero(valor, minimo, maximo, valorPorDefecto) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return valorPorDefecto;
  return Math.min(maximo, Math.max(minimo, numero));
}

export function redondearTiempo(valor, decimales = 3) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  const factor = 10 ** decimales;
  return Math.round(numero * factor) / factor;
}

export function normalizarIntensidadEdicion(valor) {
  const intensidad = normalizarTexto(valor, INTENSIDADES_EDICION_DINAMICA.NORMAL).toLowerCase();
  if (CONFIG_INTENSIDADES[intensidad]) return intensidad;
  return INTENSIDADES_EDICION_DINAMICA.NORMAL;
}

function obtenerConfigBasePorIntensidad(intensidad) {
  return { ...CONFIG_INTENSIDADES.normal, ...(CONFIG_INTENSIDADES[intensidad] || {}) };
}

export function obtenerConfigEdicionDinamica(opciones = {}) {
  const intensidad = normalizarIntensidadEdicion(opciones.intensidadEdicion || opciones.intensidadEdicionDinamica || opciones.modoEdicionDinamica || opciones.modoRitmoVisual);
  const base = obtenerConfigBasePorIntensidad(intensidad);
  const edicionDinamicaActiva = normalizarBooleano(opciones.edicionDinamica ?? opciones.activarEdicionDinamica ?? opciones.usarEdicionDinamica, false);

  return {
    version: '1.0.0',
    activo: edicionDinamicaActiva,
    intensidad,
    modoSeguro: normalizarBooleano(opciones.modoSeguroEdicionDinamica, true),
    cortes: {
      activo: normalizarBooleano(opciones.cortarSilencios, true),
      usarAudioMejoradoParaSilencios: normalizarBooleano(opciones.usarAudioMejoradoParaSilencios, true),
      ruidoDb: limitarNumero(opciones.ruidoDbSilencios, -60, -20, base.ruidoDb),
      silencioMinimoSegundos: limitarNumero(opciones.silencioMinimoSegundos, 0.15, 3, base.silencioMinimoSegundos),
      margenAntesFrase: limitarNumero(opciones.margenAntesFrase, 0, 0.8, base.margenAntesFrase),
      margenDespuesFrase: limitarNumero(opciones.margenDespuesFrase, 0, 0.8, base.margenDespuesFrase),
      duracionMinimaSegmento: limitarNumero(opciones.duracionMinimaSegmento, 0.3, 4, base.duracionMinimaSegmento),
      maximoCortes: Math.round(limitarNumero(opciones.maximoCortes, 5, 250, base.maximoCortes)),
      porcentajeMaximoEliminacion: limitarNumero(opciones.porcentajeMaximoEliminacion, 0.1, 0.75, base.porcentajeMaximoEliminacion)
    },
    visual: {
      activo: normalizarBooleano(opciones.agregarEfectosVisualesDinamicos, true),
      agregarZooms: normalizarBooleano(opciones.agregarZooms, true),
      agregarPunchIn: normalizarBooleano(opciones.agregarPunchIn, true),
      agregarBarraProgreso: normalizarBooleano(opciones.agregarBarraProgreso, true),
      agregarEtiquetasVisuales: normalizarBooleano(opciones.agregarEtiquetasVisuales, true)
    },
    sonidos: {
      activo: normalizarBooleano(opciones.agregarSonidosEdicion, true),
      modo: normalizarTexto(opciones.modoSonidosEdicion, 'normal').toLowerCase(),
      volumen: limitarNumero(opciones.volumenSonidosEdicion, 0.05, 0.65, 0.28),
      separacionMinimaSegundos: limitarNumero(opciones.separacionMinimaSonidos, 0.5, 4, 1.2)
    }
  };
}

export default obtenerConfigEdicionDinamica;
