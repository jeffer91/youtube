import { redondearTiempo } from '../edicion-dinamica.config.js';

function obtenerDuracion(edicionDinamica) {
  return Number(edicionDinamica?.mapaTiempo?.duracionEditada || edicionDinamica?.cortes?.resumen?.duracionEditada || 0);
}

function obtenerPerfil(opciones = {}) {
  return String(opciones?.perfil || 'general').trim().toLowerCase();
}

function obtenerEstiloZoom(opciones = {}) {
  const perfil = obtenerPerfil(opciones);
  if (['11-contra-11', 'futbol'].includes(perfil)) return { intervalo: 5.5, duracion: 1.9, intensidad: 1.055, texto: '11 CONTRA 11' };
  if (['jeff-isekai', 'anime'].includes(perfil)) return { intervalo: 5.2, duracion: 1.8, intensidad: 1.065, texto: 'ISEKAI' };
  if (['el-don-historia', 'cine'].includes(perfil)) return { intervalo: 8.5, duracion: 2.6, intensidad: 1.025, texto: 'HISTORIA' };
  if (['creciaula', 'educacion'].includes(perfil)) return { intervalo: 7, duracion: 2.2, intensidad: 1.035, texto: 'IDEA CLAVE' };
  if (perfil === 'institucional') return { intervalo: 9, duracion: 2.4, intensidad: 1.020, texto: 'PUNTO CLAVE' };
  if (perfil === 'jeff-verso') return { intervalo: 6, duracion: 2.0, intensidad: 1.045, texto: 'JEFF VERSO' };
  return { intervalo: 7.5, duracion: 2.2, intensidad: 1.030, texto: 'AUTO VIDEO' };
}

export function generarZoomsDinamicos({ edicionDinamica = null, opciones = {} } = {}) {
  const duracion = obtenerDuracion(edicionDinamica);
  const activo = opciones?.agregarZooms !== false;

  if (!activo || !duracion || duracion < 4) {
    return { ok: true, omitido: true, eventos: [], mensaje: 'Zooms dinámicos omitidos.' };
  }

  const estilo = obtenerEstiloZoom(opciones);
  const eventos = [];

  for (let inicio = 1.2; inicio < duracion - 2; inicio += estilo.intervalo) {
    eventos.push({
      id: eventos.length + 1,
      tipo: 'zoom-suave',
      inicio: redondearTiempo(inicio),
      fin: redondearTiempo(Math.min(inicio + estilo.duracion, duracion)),
      intensidad: estilo.intensidad,
      texto: estilo.texto,
      prioridad: 40,
      motivo: 'Movimiento visual por perfil para evitar imagen plana.'
    });
  }

  return { ok: true, omitido: eventos.length === 0, eventos, mensaje: 'Zooms dinámicos generados por perfil.' };
}

export default generarZoomsDinamicos;
