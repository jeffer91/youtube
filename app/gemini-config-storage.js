const STORAGE_KEY = 'AutoVideoJeff.gemini.config.v2';
const LEGACY_KEY = 'AutoVideoJeff.gemini.config.v1';

export const GEMINI_DEFAULTS = Object.freeze({
  usarGemini: false,
  usarFallbackGemini: true,
  geminiCredencial: '',
  geminiModelo: 'gemini-1.5-flash',
  geminiGuia: 'Eres un editor profesional de video. Analiza el contenido antes de editar. Propón títulos, textos, ganchos visuales, animaciones, imágenes y ritmo según el perfil y la plataforma.',
  geminiTemperatura: '0.35',
  geminiTimeoutMs: '60000'
});

function leerJsonSeguro(clave) {
  try {
    const raw = window.localStorage.getItem(clave);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function normalizarConfig(config = {}) {
  return {
    ...GEMINI_DEFAULTS,
    ...config,
    usarGemini: Boolean(config.usarGemini),
    usarFallbackGemini: config.usarFallbackGemini !== false,
    geminiCredencial: String(config.geminiCredencial || '').trim(),
    geminiModelo: String(config.geminiModelo || GEMINI_DEFAULTS.geminiModelo).trim(),
    geminiGuia: String(config.geminiGuia || GEMINI_DEFAULTS.geminiGuia).trim(),
    geminiTemperatura: String(config.geminiTemperatura || GEMINI_DEFAULTS.geminiTemperatura),
    geminiTimeoutMs: String(config.geminiTimeoutMs || GEMINI_DEFAULTS.geminiTimeoutMs)
  };
}

export function leerConfigGeminiLocal() {
  const actual = leerJsonSeguro(STORAGE_KEY);
  if (actual) return normalizarConfig(actual);
  const legacy = leerJsonSeguro(LEGACY_KEY);
  if (legacy) {
    const migrado = normalizarConfig(legacy);
    guardarConfigGeminiLocal(migrado);
    return migrado;
  }
  return { ...GEMINI_DEFAULTS };
}

export function guardarConfigGeminiLocal(config = {}) {
  const limpio = normalizarConfig(config);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limpio));
  return limpio;
}

export function limpiarClaveGeminiLocal() {
  const actual = leerConfigGeminiLocal();
  return guardarConfigGeminiLocal({ ...actual, geminiCredencial: '', usarGemini: false });
}

export function describirEstadoGemini(config = leerConfigGeminiLocal()) {
  if (!config.usarGemini) return 'Gemini desactivado · fallback local activo';
  if (!config.geminiCredencial) return 'Gemini activo · falta clave API';
  return `Gemini activo · modelo ${config.geminiModelo}`;
}
