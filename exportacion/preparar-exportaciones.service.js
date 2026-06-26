/*
  Modulo: exportacion
  Funcion: preparar las salidas finales por plataforma seleccionada.
*/

import path from 'path';
import { crearExportacionModelo, normalizarPlataformas } from './exportacion.modelo.js';

function crearNombreSalida(proyectoId, plataformaId, extension = 'mp4') {
  const seguro = String(proyectoId || 'proyecto').replace(/[^a-zA-Z0-9-_]/g, '-');
  return `${seguro}-${plataformaId}.${extension}`;
}

export function prepararExportaciones(proyecto = {}, opciones = {}) {
  const plataformas = normalizarPlataformas(opciones.plataformas || proyecto.plataformas);
  const carpetaDestino = opciones.carpetaDestino || proyecto.rutas?.exportaciones || path.join('salida', 'exportaciones');
  const videoOrigen = opciones.videoOrigen || proyecto.videoEditado || proyecto.videoOrigen || '';

  return plataformas.map((plataforma) => crearExportacionModelo({
    proyectoId: proyecto.id,
    plataforma,
    videoOrigen,
    videoDestino: path.join(carpetaDestino, crearNombreSalida(proyecto.id, plataforma)).replace(/\\/g, '/'),
    estado: 'preparada'
  }));
}
