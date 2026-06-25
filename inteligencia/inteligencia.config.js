export const INTELIGENCIA_VERSION = '0.1.0';

export const INTELIGENCIA_CONFIG = Object.freeze({
  nombre: 'Inteligencia creativa básica',
  version: INTELIGENCIA_VERSION,
  activoPorDefecto: true,
  maxTitulos: 5,
  maxHashtags: 12,
  maxPuntosImportantes: 8,
  maxPalabrasClave: 16,
  minDuracionHook: 2,
  maxDuracionHook: 8,
  archivos: Object.freeze({
    inteligenciaJson: 'inteligencia-creativa.json',
    seoJson: 'seo-video.json',
    seoTxt: 'seo-video.txt',
    hookJson: 'hook-sugerido.json',
    miniaturaJson: 'miniatura-recomendada.json'
  })
});

export const PALABRAS_IMPORTANTES = Object.freeze([
  'error', 'errores', 'evita', 'clave', 'importante', 'problema', 'solución', 'solucion',
  'aprende', 'rápido', 'rapido', 'secreto', 'mejor', 'peor', 'fácil', 'facil',
  'gratis', 'nuevo', 'cambio', 'resultado', 'atención', 'atencion', 'mira', 'nunca'
]);

export function obtenerConfigInteligencia(opciones = {}) {
  return {
    ...INTELIGENCIA_CONFIG,
    activo: opciones.inteligenciaCreativa === undefined ? INTELIGENCIA_CONFIG.activoPorDefecto : opciones.inteligenciaCreativa !== false && opciones.inteligenciaCreativa !== 'false',
    maxTitulos: Number.isFinite(Number(opciones.maxTitulosSeo)) ? Math.min(Math.max(Number(opciones.maxTitulosSeo), 2), 10) : INTELIGENCIA_CONFIG.maxTitulos,
    maxHashtags: Number.isFinite(Number(opciones.maxHashtagsSeo)) ? Math.min(Math.max(Number(opciones.maxHashtagsSeo), 4), 20) : INTELIGENCIA_CONFIG.maxHashtags,
    maxPuntosImportantes: Number.isFinite(Number(opciones.maxPuntosImportantes)) ? Math.min(Math.max(Number(opciones.maxPuntosImportantes), 3), 15) : INTELIGENCIA_CONFIG.maxPuntosImportantes
  };
}

export default INTELIGENCIA_CONFIG;
