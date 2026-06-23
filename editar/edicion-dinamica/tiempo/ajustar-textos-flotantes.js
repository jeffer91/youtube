import { convertirRangoSeguro } from './convertir-tiempo-original-a-editado.js';

function obtenerListaTextos(textosFlotantes) {
  if (Array.isArray(textosFlotantes)) return textosFlotantes;
  if (Array.isArray(textosFlotantes?.textos)) return textosFlotantes.textos;
  if (Array.isArray(textosFlotantes?.momentos)) return textosFlotantes.momentos;
  return [];
}

export function ajustarTextosFlotantesDinamicos({ textosFlotantes = null, mapaTiempo } = {}) {
  const textos = obtenerListaTextos(textosFlotantes);

  if (!mapaTiempo?.bloques?.length || textos.length === 0) {
    return {
      ok: true,
      omitido: true,
      mensaje: 'No hay textos flotantes o mapa de tiempo para ajustar.',
      textos: [],
      cantidad: 0,
      descartados: 0,
      creadoEn: new Date().toISOString()
    };
  }

  const ajustados = [];
  let descartados = 0;

  for (const texto of textos) {
    const inicio = Number(texto.inicio ?? texto.start ?? 0);
    const fin = Number(texto.fin ?? texto.end ?? inicio + 1.2);
    const rango = convertirRangoSeguro({ inicio, fin, mapaTiempo, duracionMinima: 0.25 });

    if (!rango) {
      descartados += 1;
      continue;
    }

    ajustados.push({
      ...texto,
      id: ajustados.length + 1,
      inicio: rango.inicio,
      fin: rango.fin,
      duracion: rango.duracion,
      tiempoOriginal: { inicio, fin },
      ajustadoPorEdicionDinamica: true
    });
  }

  return {
    ...(textosFlotantes && typeof textosFlotantes === 'object' && !Array.isArray(textosFlotantes) ? textosFlotantes : {}),
    ok: true,
    omitido: false,
    mensaje: 'Textos flotantes ajustados al mapa de tiempo dinámico.',
    textos: ajustados,
    cantidad: ajustados.length,
    descartados,
    creadoEn: new Date().toISOString()
  };
}

export default ajustarTextosFlotantesDinamicos;
