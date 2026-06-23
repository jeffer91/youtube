import { redondearTiempo } from '../edicion-dinamica.config.js';

function obtenerDuracion(edicionDinamica) {
  return Number(edicionDinamica?.mapaTiempo?.duracionEditada || edicionDinamica?.cortes?.resumen?.duracionEditada || 0);
}

export function generarZoomsDinamicos({ edicionDinamica = null, opciones = {} } = {}) {
  const duracion = obtenerDuracion(edicionDinamica);
  const activo = opciones?.agregarZooms !== false;

  if (!activo || !duracion || duracion < 4) {
    return { ok: true, omitido: true, eventos: [], mensaje: 'Zooms dinámicos omitidos.' };
  }

  const eventos = [];
  const intervalo = duracion <= 30 ? 8 : 12;

  for (let inicio = 1.2; inicio < duracion - 2; inicio += intervalo) {
    eventos.push({
      id: eventos.length + 1,
      tipo: 'zoom-suave',
      inicio: redondearTiempo(inicio),
      fin: redondearTiempo(Math.min(inicio + 2.4, duracion)),
      intensidad: 1.015,
      prioridad: 40,
      motivo: 'Movimiento visual leve para evitar imagen estática.'
    });
  }

  return { ok: true, omitido: eventos.length === 0, eventos, mensaje: 'Zooms dinámicos generados.' };
}

export default generarZoomsDinamicos;
