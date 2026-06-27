/*
  Nueva etapa estructural - Bloque 2
  Funcion: cliente real de Gemini con fallback seguro y contexto editorial completo.
*/

import { obtenerConfigGemini } from './gemini.config.js';
import { extraerJsonSeguro, crearRespuestaFallback } from './validar-respuesta-gemini.service.js';
import { construirBloquePerfilGemini } from './perfiles-gemini.config.js';
import { construirContextoEditorialGemini } from './contexto-editorial-gemini.service.js';

function obtenerClaveGemini(opciones = {}) {
  return opciones.geminiCredencial || opciones.apiKey || opciones.api_key || process.env.GEMINI_API_KEY || '';
}

function normalizarBooleano(valor, defecto = false) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') return ['true', '1', 'si', 'sí', 'on', 'yes'].includes(valor.trim().toLowerCase());
  return defecto;
}

function crearPromptTarea(tarea = {}, opciones = {}) {
  const payload = tarea.payload || {};
  const perfil = payload.perfil || tarea.perfil || {};
  const guiaUsuario = opciones.geminiGuia || opciones.guia || '';
  return [
    construirContextoEditorialGemini(tarea, opciones),
    'INSTRUCCIONES DEL PERFIL:',
    construirBloquePerfilGemini(perfil),
    guiaUsuario ? `Guia adicional de Jeff: ${guiaUsuario}` : '',
    Array.isArray(tarea.instrucciones) ? tarea.instrucciones.join('\n') : '',
    'Payload de trabajo:',
    JSON.stringify(payload, null, 2),
    'Reglas de respuesta:',
    '- Responde solamente JSON valido, sin markdown, sin explicaciones fuera del JSON.',
    '- Usa textos breves y utiles.',
    '- No inventes fuentes ni licencias.',
    '- Si sugieres recursos, indica tema, motivo, tipo, licencia requerida y prioridad.',
    '- Si algo no es seguro, marca pendiente_revision.'
  ].filter(Boolean).join('\n\n');
}

function crearEndpoint({ modelo, apiKey }) {
  const modeloSeguro = encodeURIComponent(modelo || 'gemini-1.5-flash');
  const keySeguro = encodeURIComponent(apiKey);
  return `https://generativelanguage.googleapis.com/v1beta/models/${modeloSeguro}:generateContent?key=${keySeguro}`;
}

async function fetchConTimeout(url, opcionesFetch = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opcionesFetch, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function extraerTextoGemini(respuesta = {}) {
  return respuesta.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim() || '';
}

function crearFallbackTarea(tarea = {}, motivo = '') {
  return {
    ok: true,
    real: false,
    fallback: true,
    tarea: tarea.tarea || 'gemini',
    motivo,
    data: crearRespuestaFallback(tarea.tarea || 'gemini', motivo),
    creadoEn: new Date().toISOString()
  };
}

export async function ejecutarTareaGeminiReal(tarea = {}, opciones = {}) {
  const usarGemini = normalizarBooleano(opciones.usarGemini, false);
  const usarFallback = normalizarBooleano(opciones.usarFallbackGemini ?? opciones.usarFallbackLocal, true);
  const apiKey = obtenerClaveGemini(opciones);
  const config = obtenerConfigGemini({
    ...opciones,
    apiKey,
    modelo: opciones.geminiModelo || opciones.modelo,
    temperatura: Number(opciones.geminiTemperatura ?? opciones.temperatura ?? 0.35)
  });

  if (!usarGemini) return crearFallbackTarea(tarea, 'Gemini desactivado por configuracion.');
  if (!apiKey) {
    if (usarFallback) return crearFallbackTarea(tarea, 'No hay credencial Gemini configurada.');
    throw new Error('No hay credencial Gemini configurada.');
  }

  const prompt = crearPromptTarea(tarea, opciones);
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: config.temperatura,
      maxOutputTokens: config.maxTokens,
      responseMimeType: 'application/json'
    }
  };

  try {
    const respuesta = await fetchConTimeout(crearEndpoint({ modelo: config.modelo, apiKey }), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }, Number(opciones.geminiTimeoutMs || 60000));

    const json = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(json.error?.message || `Gemini respondio HTTP ${respuesta.status}`);
    const texto = extraerTextoGemini(json);
    const data = extraerJsonSeguro(texto);

    return {
      ok: true,
      real: true,
      fallback: false,
      tarea: tarea.tarea || 'gemini',
      modelo: config.modelo,
      data,
      textoOriginal: texto,
      contextoEditorial: true,
      creadoEn: new Date().toISOString()
    };
  } catch (error) {
    if (usarFallback) return crearFallbackTarea(tarea, error.message);
    throw error;
  }
}
