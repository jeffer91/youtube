import path from 'path';
import { escribirJson } from '../../comun/archivos.js';
import { obtenerConfigTranscripcion } from '../transcripcion.config.js';

function validarCarpetaProyecto(entrada) {
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede crear reporte Gemini porque falta la carpeta del proyecto.');
  return entrada.rutas.carpetaProyecto;
}

function limpiarConfigGemini(geminiResultado) {
  const config = geminiResultado?.config || {};
  return { proveedor: config.proveedor || 'google-gemini', usarGemini: Boolean(config.usarGemini), tieneCredencial: Boolean(config.tieneCredencial), modelo: config.modelo || null, timeoutMs: config.timeoutMs || null, cantidadMaximaTextos: config.cantidadMaximaTextos || null, usarFallbackLocal: Boolean(config.usarFallbackLocal) };
}

export async function crearReporteGemini({ entrada, paqueteGemini, geminiResultado, fallbackResultado = null, opciones = {} } = {}) {
  const config = obtenerConfigTranscripcion(opciones);
  const carpetaProyecto = validarCarpetaProyecto(entrada);
  const rutaReporte = path.join(carpetaProyecto, config.archivos.reporteGemini);
  const origenFinal = fallbackResultado?.ok ? fallbackResultado.origen : geminiResultado?.origen || 'sin-origen';
  const momentos = fallbackResultado?.ok ? fallbackResultado.momentosImportantes || [] : geminiResultado?.momentosImportantes || [];
  const reporte = { ok: true, tipo: 'reporte-gemini', proyectoId: entrada?.proyecto?.id || null, paquete: { creado: Boolean(paqueteGemini?.ok), cantidadSegmentos: paqueteGemini?.transcripcion?.cantidadSegmentos || 0 }, gemini: { ok: Boolean(geminiResultado?.ok), omitido: Boolean(geminiResultado?.omitido), mensaje: geminiResultado?.mensaje || null, error: geminiResultado?.error || null, config: limpiarConfigGemini(geminiResultado) }, fallback: fallbackResultado ? { ok: Boolean(fallbackResultado.ok), origen: fallbackResultado.origen, mensaje: fallbackResultado.mensaje, motivo: fallbackResultado.motivo || null, cantidad: fallbackResultado.cantidad || 0 } : null, origenFinal, cantidadMomentos: momentos.length, momentos, creadoEn: new Date().toISOString() };
  await escribirJson(rutaReporte, reporte);
  return { ok: true, rutaReporte, nombreArchivo: path.basename(rutaReporte), reporte };
}

export default crearReporteGemini;
