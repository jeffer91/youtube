import { redondearTiempo } from '../edicion-dinamica.config.js';

function obtenerMomentos(transcripcion) {
  const fuentes = [
    transcripcion?.gemini?.momentosImportantes,
    transcripcion?.fallback?.momentosImportantes,
    transcripcion?.textosFlotantes?.textos
  ];

  for (const fuente of fuentes) {
    if (Array.isArray(fuente) && fuente.length > 0) return fuente;
  }

  return [];
}

export function generarPunchInDinamicos({ transcripcion = null, opciones = {} } = {}) {
  const activo = opciones?.agregarPunchIn !== false;
  const momentos = obtenerMomentos(transcripcion);

  if (!activo || momentos.length === 0) {
    return { ok: true, omitido: true, eventos: [], mensaje: 'Punch-in omitido porque no hay momentos importantes.' };
  }

  const eventos = momentos.slice(0, 6).map((momento, index) => {
    const inicio = Number(momento.inicio ?? momento.start ?? 0);
    const finBase = Number(momento.fin ?? momento.end ?? inicio + 1.6);
    const fin = Math.min(finBase, inicio + 2.2);

    return {
      id: index + 1,
      tipo: 'punch-in',
      inicio: redondearTiempo(inicio),
      fin: redondearTiempo(fin),
      intensidad: 1.035,
      prioridad: 10 + index,
      texto: momento.texto || momento.titulo || momento.frase || '',
      motivo: momento.motivo || 'Momento importante detectado.'
    };
  });

  return { ok: true, omitido: eventos.length === 0, eventos, mensaje: 'Punch-in dinámicos generados.' };
}

export default generarPunchInDinamicos;
