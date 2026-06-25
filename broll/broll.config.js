export const BROLL_VERSION = '0.1.0';

export const BROLL_CONFIG = Object.freeze({
  nombre: 'B-Roll sugerido',
  version: BROLL_VERSION,
  activoPorDefecto: true,
  modo: 'sugerencias-locales',
  maxSugerencias: 8,
  duracionSugeridaSegundos: 3.5,
  separacionMinimaSegundos: 4,
  archivoSugerencias: 'broll-sugerido.json',
  tipos: Object.freeze([
    'imagen-apoyo',
    'video-apoyo',
    'texto-contexto',
    'captura-recurso',
    'grafico-simple'
  ])
});

export function obtenerConfigBroll(opciones = {}) {
  const activo = opciones.brollActivo ?? opciones.usarBroll ?? opciones.agregarBroll ?? BROLL_CONFIG.activoPorDefecto;
  const max = Number(opciones.maxBroll || opciones.maxSugerenciasBroll || BROLL_CONFIG.maxSugerencias);
  return {
    ...BROLL_CONFIG,
    activo: !(activo === false || activo === 'false' || activo === '0' || activo === 'no'),
    maxSugerencias: Number.isFinite(max) ? Math.min(Math.max(Math.round(max), 1), 20) : BROLL_CONFIG.maxSugerencias,
    descargarAutomaticamente: false,
    requiereRevision: true
  };
}

export default BROLL_CONFIG;
