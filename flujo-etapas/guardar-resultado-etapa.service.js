/*
  Bloque 3: Estado de proyecto por etapas
  Función: guardar el resultado JSON de cada etapa en su carpeta estándar.
*/

import path from 'path';
import { asegurarCarpeta, escribirJson } from '../comun/archivos.js';
import { ARCHIVOS_RESULTADO_ETAPA, CARPETAS_RESULTADO_ETAPA, etapaEsValida } from './estado-proyecto.modelo.js';
import { obtenerCarpetaProyectoEtapas } from './estado-proyecto.service.js';

export function obtenerCarpetaResultadoEtapa({ proyectoId, carpetaProyecto = null, etapa } = {}) {
  if (!etapaEsValida(etapa)) throw new Error(`Etapa inválida para guardar resultado: ${etapa}`);
  const carpetaEtapa = CARPETAS_RESULTADO_ETAPA[etapa];
  if (!carpetaEtapa) throw new Error(`La etapa ${etapa} no tiene carpeta de resultado configurada.`);
  return path.join(obtenerCarpetaProyectoEtapas(proyectoId, carpetaProyecto), carpetaEtapa);
}

export function obtenerRutaResultadoEtapa({ proyectoId, carpetaProyecto = null, etapa, nombreArchivo = null } = {}) {
  const archivo = nombreArchivo || ARCHIVOS_RESULTADO_ETAPA[etapa];
  if (!archivo) throw new Error(`La etapa ${etapa} no tiene archivo de resultado configurado.`);
  return path.join(obtenerCarpetaResultadoEtapa({ proyectoId, carpetaProyecto, etapa }), archivo);
}

export async function guardarResultadoEtapa({ proyectoId, carpetaProyecto = null, etapa, resultado, nombreArchivo = null, metadata = {} } = {}) {
  if (!resultado || typeof resultado !== 'object') throw new Error('No se puede guardar resultado de etapa inválido.');
  const carpeta = obtenerCarpetaResultadoEtapa({ proyectoId, carpetaProyecto, etapa });
  asegurarCarpeta(carpeta);
  const ruta = obtenerRutaResultadoEtapa({ proyectoId, carpetaProyecto, etapa, nombreArchivo });
  const datos = {
    ok: true,
    etapa,
    proyectoId,
    resultado,
    metadata,
    guardadoEn: new Date().toISOString()
  };
  await escribirJson(ruta, datos);
  return {
    ok: true,
    etapa,
    proyectoId,
    ruta,
    nombreArchivo: path.basename(ruta),
    carpeta,
    datos
  };
}
