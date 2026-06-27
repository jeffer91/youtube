/*
  Bloque 3: Estado de proyecto por etapas
  Función: leer, crear y actualizar estado-proyecto.json sin cambiar todavía el flujo legacy.
*/

import path from 'path';
import { asegurarCarpeta, escribirJson, leerJsonSiExiste, obtenerRutaRaiz } from '../comun/archivos.js';
import { crearEstadoProyectoEtapas, etapaEsValida, obtenerEtapaAnterior, obtenerSiguienteEtapa, ESTADOS_PROYECTO_ETAPAS } from './estado-proyecto.modelo.js';
import { exigirTransicionEtapa } from './validar-transicion-etapa.service.js';

export function obtenerCarpetaProyectoEtapas(proyectoId, carpetaProyecto = null) {
  if (!proyectoId) throw new Error('Falta proyectoId para ubicar carpeta del proyecto.');
  return carpetaProyecto || path.join(obtenerRutaRaiz(), 'datos', 'proyectos', proyectoId);
}

export function obtenerRutaEstadoProyecto(proyectoId, carpetaProyecto = null) {
  return path.join(obtenerCarpetaProyectoEtapas(proyectoId, carpetaProyecto), 'estado-proyecto.json');
}

export async function cargarEstadoProyectoEtapas({ proyectoId, carpetaProyecto = null, crearSiFalta = true, nombre = 'Proyecto AutoVideoJeff' } = {}) {
  const rutaEstado = obtenerRutaEstadoProyecto(proyectoId, carpetaProyecto);
  const existente = await leerJsonSiExiste(rutaEstado, null);
  if (existente) return existente;
  if (!crearSiFalta) return null;
  const estado = crearEstadoProyectoEtapas({ proyectoId, nombre });
  await guardarEstadoProyectoEtapas({ proyectoId, carpetaProyecto, estado, mensaje: 'Estado inicial creado automáticamente.' });
  return estado;
}

export async function guardarEstadoProyectoEtapas({ proyectoId, carpetaProyecto = null, estado, mensaje = 'Estado de proyecto actualizado.' } = {}) {
  if (!estado || typeof estado !== 'object') throw new Error('No se puede guardar estado de proyecto inválido.');
  const carpeta = obtenerCarpetaProyectoEtapas(proyectoId || estado.proyectoId, carpetaProyecto);
  asegurarCarpeta(carpeta);
  const fecha = new Date().toISOString();
  const estadoFinal = {
    ...estado,
    proyectoId: proyectoId || estado.proyectoId,
    etapaAnterior: obtenerEtapaAnterior(estado.etapaActual),
    siguienteEtapa: obtenerSiguienteEtapa(estado.etapaActual),
    actualizadoEn: fecha,
    historial: [
      ...(Array.isArray(estado.historial) ? estado.historial : []),
      {
        fecha,
        etapa: estado.etapaActual,
        estado: estado.estado,
        mensaje
      }
    ]
  };
  await escribirJson(path.join(carpeta, 'estado-proyecto.json'), estadoFinal);
  return estadoFinal;
}

export async function avanzarEstadoProyectoEtapas({ proyectoId, carpetaProyecto = null, etapaDestino, estadoDestino = null, archivoGenerado = null, mensaje = 'Etapa actualizada.' } = {}) {
  if (!etapaEsValida(etapaDestino)) throw new Error(`Etapa destino inválida: ${etapaDestino}`);
  const estadoActual = await cargarEstadoProyectoEtapas({ proyectoId, carpetaProyecto });
  exigirTransicionEtapa({ etapaActual: estadoActual.etapaActual, etapaDestino, permitirRetroceso: true, permitirMismaEtapa: true });

  const etapaCompletada = estadoActual.etapaActual !== etapaDestino ? estadoActual.etapaActual : null;
  const etapasCompletadas = new Set(Array.isArray(estadoActual.etapasCompletadas) ? estadoActual.etapasCompletadas : []);
  if (etapaCompletada) etapasCompletadas.add(etapaCompletada);

  const archivosPorEtapa = {
    ...(estadoActual.archivosPorEtapa || {})
  };
  if (archivoGenerado) archivosPorEtapa[etapaDestino] = archivoGenerado;

  return await guardarEstadoProyectoEtapas({
    proyectoId,
    carpetaProyecto,
    mensaje,
    estado: {
      ...estadoActual,
      estado: estadoDestino || estadoActual.estado || ESTADOS_PROYECTO_ETAPAS.CREADO,
      etapaActual: etapaDestino,
      etapasCompletadas: Array.from(etapasCompletadas),
      archivosPorEtapa
    }
  });
}

export async function marcarErrorEstadoProyectoEtapas({ proyectoId, carpetaProyecto = null, etapa, error, mensaje = 'La etapa terminó con error controlado.' } = {}) {
  const estadoActual = await cargarEstadoProyectoEtapas({ proyectoId, carpetaProyecto });
  const fecha = new Date().toISOString();
  const etapaError = etapa || estadoActual.etapaActual;
  return await guardarEstadoProyectoEtapas({
    proyectoId,
    carpetaProyecto,
    mensaje,
    estado: {
      ...estadoActual,
      estado: ESTADOS_PROYECTO_ETAPAS.ERROR,
      etapaActual: etapaError,
      etapasConError: [
        ...(Array.isArray(estadoActual.etapasConError) ? estadoActual.etapasConError : []),
        {
          fecha,
          etapa: etapaError,
          mensaje: error?.message || String(error || mensaje)
        }
      ]
    }
  });
}
