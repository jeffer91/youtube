/*
  Bloque 3 - Motor de IAs gratis para Plan
  Función: definir proveedores gratuitos/remotos/locales para generar planes de edición.
*/

export const PROVEEDORES_IA_PLAN = Object.freeze({
  gemini: {
    id: 'gemini',
    nombre: 'Gemini gratis',
    tipo: 'remoto-gratis',
    requiereInternet: true,
    requiereApiKey: true,
    prioridad: 1,
    modelo: 'gemini-1.5-flash',
    endpointBase: 'https://generativelanguage.googleapis.com/v1beta/models'
  },
  ollama: {
    id: 'ollama',
    nombre: 'Ollama local',
    tipo: 'local-gratis',
    requiereInternet: false,
    requiereApiKey: false,
    prioridad: 2,
    modelo: 'llama3.2',
    endpointBase: 'http://127.0.0.1:11434'
  },
  lmstudio: {
    id: 'lmstudio',
    nombre: 'LM Studio local',
    tipo: 'local-gratis',
    requiereInternet: false,
    requiereApiKey: false,
    prioridad: 3,
    modelo: 'local-model',
    endpointBase: 'http://127.0.0.1:1234/v1'
  },
  gpt4all: {
    id: 'gpt4all',
    nombre: 'GPT4All local',
    tipo: 'local-gratis',
    requiereInternet: false,
    requiereApiKey: false,
    prioridad: 4,
    modelo: 'gpt4all-local',
    endpointBase: 'http://127.0.0.1:4891/v1'
  },
  fallback: {
    id: 'fallback',
    nombre: 'Fallback interno',
    tipo: 'interno-seguro',
    requiereInternet: false,
    requiereApiKey: false,
    prioridad: 99,
    modelo: 'auto-video-jeff-fallback',
    endpointBase: 'interno'
  }
});

export const ORDEN_AUTO_IA_PLAN = Object.freeze(['gemini', 'ollama', 'lmstudio', 'gpt4all', 'fallback']);
export const PROVEEDORES_LOCALES_IA_PLAN = Object.freeze(['ollama', 'lmstudio', 'gpt4all']);

function numero(valor, respaldo) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').trim();
  return limpio || respaldo;
}

function bool(valor, respaldo = false) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') return ['1', 'true', 'si', 'sí', 'on', 'yes'].includes(valor.trim().toLowerCase());
  return respaldo;
}

export function obtenerConfigIAPlan(opciones = {}) {
  return {
    modo: texto(opciones.modoIA || opciones.modo || process.env.AUTOVIDEO_IA_MODO, 'automatico'),
    proveedorPreferido: texto(opciones.proveedorIA || opciones.proveedor || process.env.AUTOVIDEO_IA_PROVEEDOR, 'automatico'),
    timeoutMs: numero(opciones.timeoutMs || process.env.AUTOVIDEO_IA_TIMEOUT_MS, 90000),
    temperatura: numero(opciones.temperaturaIA || opciones.temperatura || process.env.AUTOVIDEO_IA_TEMPERATURA, 0.35),
    maxTokens: numero(opciones.maxTokensIA || opciones.maxTokens || process.env.AUTOVIDEO_IA_MAX_TOKENS, 4096),
    generarDosOpciones: bool(opciones.generarDosOpciones ?? process.env.AUTOVIDEO_IA_DOS_OPCIONES, true),
    seleccionarMejorAutomaticamente: bool(opciones.seleccionarMejorAutomaticamente ?? process.env.AUTOVIDEO_IA_AUTO_BEST, true),
    proveedores: {
      gemini: {
        ...PROVEEDORES_IA_PLAN.gemini,
        modelo: texto(opciones.geminiModelo || process.env.GEMINI_MODEL, PROVEEDORES_IA_PLAN.gemini.modelo),
        apiKey: texto(opciones.geminiApiKey || opciones.geminiCredencial || opciones.apiKey || process.env.GEMINI_API_KEY, ''),
        activo: bool(opciones.usarGemini ?? process.env.AUTOVIDEO_USAR_GEMINI, true)
      },
      ollama: {
        ...PROVEEDORES_IA_PLAN.ollama,
        modelo: texto(opciones.ollamaModelo || process.env.OLLAMA_MODEL, PROVEEDORES_IA_PLAN.ollama.modelo),
        endpointBase: texto(opciones.ollamaUrl || process.env.OLLAMA_URL, PROVEEDORES_IA_PLAN.ollama.endpointBase),
        activo: bool(opciones.usarOllama ?? process.env.AUTOVIDEO_USAR_OLLAMA, true)
      },
      lmstudio: {
        ...PROVEEDORES_IA_PLAN.lmstudio,
        modelo: texto(opciones.lmstudioModelo || process.env.LMSTUDIO_MODEL, PROVEEDORES_IA_PLAN.lmstudio.modelo),
        endpointBase: texto(opciones.lmstudioUrl || process.env.LMSTUDIO_URL, PROVEEDORES_IA_PLAN.lmstudio.endpointBase),
        activo: bool(opciones.usarLmstudio ?? process.env.AUTOVIDEO_USAR_LMSTUDIO, true)
      },
      gpt4all: {
        ...PROVEEDORES_IA_PLAN.gpt4all,
        modelo: texto(opciones.gpt4allModelo || process.env.GPT4ALL_MODEL, PROVEEDORES_IA_PLAN.gpt4all.modelo),
        endpointBase: texto(opciones.gpt4allUrl || process.env.GPT4ALL_URL, PROVEEDORES_IA_PLAN.gpt4all.endpointBase),
        activo: bool(opciones.usarGpt4all ?? process.env.AUTOVIDEO_USAR_GPT4ALL, true)
      },
      fallback: {
        ...PROVEEDORES_IA_PLAN.fallback,
        activo: true
      }
    }
  };
}

export function listarProveedoresIAPlan(opciones = {}) {
  const config = obtenerConfigIAPlan(opciones);
  return ORDEN_AUTO_IA_PLAN.map((id) => ({
    ...config.proveedores[id],
    configurado: id === 'gemini' ? Boolean(config.proveedores[id].apiKey) : true
  }));
}
