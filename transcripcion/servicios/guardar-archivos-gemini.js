import path from 'path';
import { escribirJson } from '../../comun/archivos.js';
import { obtenerConfigTranscripcion } from '../transcripcion.config.js';

function validarCarpetaProyecto(entrada) {
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se pueden guardar archivos Gemini porque falta la carpeta del proyecto.');
  return entrada.rutas.carpetaProyecto;
}

function limpiarConfig(config = {}) {
  return { proveedor: config.proveedor || 'google-gemini', usarGemini: Boolean(config.usarGemini), tieneCredencial: Boolean(config.tieneCredencial), modelo: config.modelo || null, timeoutMs: config.timeoutMs || null, cantidadMaximaTextos: config.cantidadMaximaTextos || null, usarFallbackLocal: Boolean(config.usarFallbackLocal) };
}

function limpiarGeminiResultado(geminiResultado) {
  if (!geminiResultado || typeof geminiResultado !== 'object') return null;
  return { ok: Boolean(geminiResultado.ok), omitido: Boolean(geminiResultado.omitido), origen: geminiResultado.origen || 'gemini', mensaje: geminiResultado.mensaje || null, error: geminiResultado.error || null, config: limpiarConfig(geminiResultado.config), respuestaBruta: geminiResultado.respuestaBruta || null, respuestaLimpia: geminiResultado.respuestaLimpia || null, validacion: geminiResultado.validacion || null, momentosImportantes: geminiResultado.momentosImportantes || [], creadoEn: geminiResultado.creadoEn || new Date().toISOString() };
}

function limpiarValidacionFinal({ geminiResultado, fallbackResultado }) {
  const usarFallback = Boolean(fallbackResultado?.ok);
  const origen = usarFallback ? fallbackResultado.origen : geminiResultado?.origen || 'gemini';
  const momentos = usarFallback ? fallbackResultado.momentosImportantes || [] : geminiResultado?.momentosImportantes || [];
  return { ok: momentos.length > 0, origen, usoFallback: usarFallback, cantidadMomentos: momentos.length, momentosImportantes: momentos, gemini: { ok: Boolean(geminiResultado?.ok), omitido: Boolean(geminiResultado?.omitido), mensaje: geminiResultado?.mensaje || null, error: geminiResultado?.error || null }, fallback: fallbackResultado ? { ok: Boolean(fallbackResultado.ok), mensaje: fallbackResultado.mensaje || null, motivo: fallbackResultado.motivo || null, cantidad: fallbackResultado.cantidad || 0 } : null, creadoEn: new Date().toISOString() };
}

export async function guardarArchivosGemini({ entrada, paqueteGemini, geminiResultado, fallbackResultado = null, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const carpetaProyecto = validarCarpetaProyecto(entrada);
  const rutaPaquete = path.join(carpetaProyecto, config.archivos.geminiPaquete);
  const rutaRespuesta = path.join(carpetaProyecto, config.archivos.geminiRespuesta);
  const rutaValidada = path.join(carpetaProyecto, config.archivos.geminiRespuestaValidada);
  const paqueteSeguro = { ...(paqueteGemini || {}), seguridad: { credencialGuardada: false, nota: 'La credencial de Gemini no se guarda en los archivos del proyecto.' } };
  const respuestaSegura = limpiarGeminiResultado(geminiResultado);
  const validacionFinal = limpiarValidacionFinal({ geminiResultado, fallbackResultado });
  await escribirJson(rutaPaquete, paqueteSeguro);
  await escribirJson(rutaRespuesta, respuestaSegura);
  await escribirJson(rutaValidada, validacionFinal);
  return { ok: true, paquete: { ruta: rutaPaquete, nombre: path.basename(rutaPaquete) }, respuesta: { ruta: rutaRespuesta, nombre: path.basename(rutaRespuesta) }, validada: { ruta: rutaValidada, nombre: path.basename(rutaValidada) }, creadoEn: new Date().toISOString() };
}

export default guardarArchivosGemini;
