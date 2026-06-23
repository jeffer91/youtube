import { convertirRangoSeguro } from './convertir-tiempo-original-a-editado.js';

function obtenerMomentos(origen) {
  if (Array.isArray(origen)) return origen;
  if (Array.isArray(origen?.momentosImportantes)) return origen.momentosImportantes;
  if (Array.isArray(origen?.textosFlotantes)) return origen.textosFlotantes;
  if (Array.isArray(origen?.momentos)) return origen.momentos;
  return [];
}

export function ajustarMomentosImportantesDinamicos({ origenMomentos = null, mapaTiempo } = {}) {
  const momentos = obtenerMomentos(origenMomentos);

  if (!mapaTiempo?.bloques?.length || momentos.length === 0) {
    return {
      ok: true,
      omitido: true,
      mensaje: 'No hay momentos importantes o mapa de tiempo para ajustar.',
      momentosImportantes: [],
      cantidad: 0,
      descartados: 0,
      creadoEn: new Date().toISOString()
    };
  }

  const ajustados = [];
  let descartados = 0;

  for (const momento of momentos) {
    const inicio = Number(momento.inicio ?? momento.start ?? 0);
    const fin = Number(momento.fin ?? momento.end ?? inicio + 1.5);
    const rango = convertirRangoSeguro({ inicio, fin, mapaTiempo, duracionMinima: 0.2 });

    if (!rango) {
      descartados += 1;
      continue;
    }

    ajustados.push({
      ...momento,
      id: ajustados.length + 1,
      inicio: rango.inicio,
      fin: rango.fin,
      duracion: rango.duracion,
      tiempoOriginal: { inicio, fin },
      ajustadoPorEdicionDinamica: true
    });
  }

  return {
    ...(origenMomentos && typeof origenMomentos === 'object' && !Array.isArray(origenMomentos) ? origenMomentos : {}),
    ok: true,
    omitido: false,
    mensaje: 'Momentos importantes ajustados al mapa de tiempo dinámico.',
    momentosImportantes: ajustados,
    cantidad: ajustados.length,
    descartados,
    creadoEn: new Date().toISOString()
  };
}

export default ajustarMomentosImportantesDinamicos;
