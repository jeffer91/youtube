import { obtenerConfigGemini, crearResumenGeminiConfig } from './gemini.config.js';
import { construirPromptGemini, construirCuerpoGemini } from './construir-prompt-gemini.js';
import { limpiarJsonGemini, obtenerTextoGeminiDesdeRespuestaApi } from './limpiar-json-gemini.js';
import { validarRespuestaGemini } from './validar-respuesta-gemini.js';

function resultadoOmitido(mensaje, configGemini) {
  return { ok: true, omitido: true, origen: 'gemini', mensaje, config: crearResumenGeminiConfig(configGemini), respuestaBruta: null, respuestaLimpia: null, validacion: null, momentosImportantes: [], creadoEn: new Date().toISOString() };
}

function resultadoError(error, configGemini) {
  return { ok: false, omitido: false, origen: 'gemini', mensaje: error?.message || 'Gemini no pudo procesar la solicitud.', config: crearResumenGeminiConfig(configGemini), respuestaBruta: null, respuestaLimpia: null, validacion: null, momentosImportantes: [], error: error?.message || String(error), creadoEn: new Date().toISOString() };
}

async function fetchConTimeout(url, opcionesFetch, timeoutMs) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opcionesFetch, signal: controlador.signal });
  } finally {
    clearTimeout(temporizador);
  }
}

function crearUrlGeneracion(configGemini) {
  const separador = configGemini.endpointGeneracion.includes('?') ? '&' : '?';
  return `${configGemini.endpointGeneracion}${separador}key=${encodeURIComponent(configGemini.credencial)}`;
}

function extraerMensajeErrorApi(data, respuesta) {
  return data?.error?.message || data?.message || `Gemini respondió con estado HTTP ${respuesta.status}.`;
}

export async function consultarGeminiParaMomentos({ paqueteGemini, segmentos = [], opciones = {} } = {}) {
  const configGemini = obtenerConfigGemini(opciones);
  if (!configGemini.usarGemini) return resultadoOmitido('Gemini está desactivado en las opciones.', configGemini);
  if (!configGemini.tieneCredencial) return resultadoOmitido('No se recibió credencial de Gemini desde la interfaz.', configGemini);
  if (!paqueteGemini || typeof paqueteGemini !== 'object') return resultadoError(new Error('Falta el paquete de transcripción para Gemini.'), configGemini);
  try {
    const promptGemini = construirPromptGemini(paqueteGemini, opciones);
    const cuerpo = construirCuerpoGemini(promptGemini);
    const respuesta = await fetchConTimeout(crearUrlGeneracion(configGemini), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) }, configGemini.timeoutMs);
    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(extraerMensajeErrorApi(data, respuesta));
    const textoRespuesta = obtenerTextoGeminiDesdeRespuestaApi(data);
    const respuestaLimpia = limpiarJsonGemini(textoRespuesta || data);
    if (!respuestaLimpia.ok) throw new Error(respuestaLimpia.error || 'Gemini no devolvió JSON válido.');
    const validacion = validarRespuestaGemini({ respuesta: respuestaLimpia.data, segmentos, opciones });
    return { ok: validacion.ok, omitido: false, origen: 'gemini', mensaje: validacion.ok ? 'Gemini detectó momentos importantes correctamente.' : 'Gemini respondió, pero no quedaron momentos válidos.', config: crearResumenGeminiConfig(configGemini), prompt: { modelo: promptGemini.modelo, creadoEn: promptGemini.creadoEn }, respuestaBruta: textoRespuesta || data, respuestaLimpia, validacion, momentosImportantes: validacion.momentosImportantes || [], creadoEn: new Date().toISOString() };
  } catch (error) {
    return resultadoError(error, configGemini);
  }
}

export default consultarGeminiParaMomentos;
