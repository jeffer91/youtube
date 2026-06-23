import path from 'path';
import { escribirJson, asegurarCarpeta } from '../../comun/archivos.js';
import { obtenerConfigEdicionDinamica } from './edicion-dinamica.config.js';
import { procesarCortesDinamicos } from './cortes/cortes.conexion.js';
import { procesarTiempoDinamico } from './tiempo/tiempo.conexion.js';

function crearRespuestaOmitida({ motivo, config, entrada }) {
  return { ok: true, omitido: true, etapa: 'edicion-dinamica', activo: false, motivo, config: { intensidad: config?.intensidad || null, modoSeguro: Boolean(config?.modoSeguro) }, videoDinamico: null, audioDinamico: null, transcripcionAjustada: null, mapaTiempo: null, cortes: null, visual: null, sonidos: null, reportes: [], diagnostico: { ok: true, mensaje: motivo }, proyectoId: entrada?.proyecto?.id || null, creadoEn: new Date().toISOString() };
}

function obtenerCarpetaEdicionDinamica(entrada) {
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto) throw new Error('No se puede procesar edición dinámica sin carpeta del proyecto.');
  const carpeta = path.join(carpetaProyecto, 'edicion-dinamica');
  asegurarCarpeta(carpeta);
  return carpeta;
}

export async function procesarEdicionDinamica({ entrada, entendimiento, audio = null, transcripcion = null, opciones = {} } = {}) {
  const config = obtenerConfigEdicionDinamica(opciones);
  if (!config.activo) return crearRespuestaOmitida({ motivo: 'La edición dinámica está desactivada.', config, entrada });
  const carpetaEdicionDinamica = obtenerCarpetaEdicionDinamica(entrada);
  const cortes = await procesarCortesDinamicos({ entrada, entendimiento, audio, config, carpetaEdicionDinamica, opciones });
  const tiempo = await procesarTiempoDinamico({ entrada, entendimiento, transcripcion, cortes, config, carpetaEdicionDinamica, opciones });
  const resultado = { ok: true, omitido: false, etapa: 'edicion-dinamica', activo: true, proyectoId: entrada?.proyecto?.id || null, carpetaEdicionDinamica, videoDinamico: cortes?.videoDinamico || null, audioDinamico: cortes?.audioDinamico || null, transcripcionAjustada: tiempo?.transcripcionAjustada || null, mapaTiempo: tiempo?.mapaTiempo || null, cortes, tiempo, visual: { ok: true, pendiente: true, mensaje: 'Los efectos visuales dinámicos se conectan en el siguiente bloque.' }, sonidos: { ok: true, pendiente: true, mensaje: 'Los efectos de sonido se conectan en el bloque de sonidos.' }, diagnostico: { ok: true, mensaje: cortes?.omitido ? cortes.mensaje : 'Edición dinámica base procesada correctamente.', cortesAplicados: cortes?.resumen?.cantidadCortesAplicados || 0, segundosEliminados: cortes?.resumen?.segundosEliminados || 0, tieneMapaTiempo: Boolean(tiempo?.mapaTiempo) }, creadoEn: new Date().toISOString() };
  const rutaResumen = path.join(carpetaEdicionDinamica, 'edicion-dinamica.json');
  await escribirJson(rutaResumen, resultado);
  return { ...resultado, rutaResumen };
}

export default procesarEdicionDinamica;
