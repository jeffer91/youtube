/*
  Modulo: subtitulos
  Funcion: crear subtitulos desde segmentos de transcripcion.
*/

function dividirTexto(texto = '', maxCaracteres = 32) {
  const palabras = String(texto).trim().split(/\s+/).filter(Boolean);
  const lineas = [];
  let linea = '';

  palabras.forEach((palabra) => {
    const candidata = `${linea} ${palabra}`.trim();
    if (candidata.length > maxCaracteres && linea) {
      lineas.push(linea);
      linea = palabra;
    } else {
      linea = candidata;
    }
  });

  if (linea) lineas.push(linea);
  return lineas;
}

export function generarSubtitulosDesdeSegmentos(segmentos = [], opciones = {}) {
  const maxCaracteres = opciones.maxCaracteres || 32;
  return segmentos.map((segmento, indice) => ({
    id: segmento.id || `sub-${indice + 1}`,
    inicio: Number(segmento.inicio ?? segmento.start ?? 0),
    fin: Number(segmento.fin ?? segmento.end ?? 0),
    texto: String(segmento.texto ?? segmento.text ?? '').trim(),
    lineas: dividirTexto(segmento.texto ?? segmento.text ?? '', maxCaracteres),
    palabrasClave: segmento.palabrasClave || [],
    estado: 'generado'
  })).filter((subtitulo) => subtitulo.texto && subtitulo.fin >= subtitulo.inicio);
}

export function generarSubtitulosPlan(transcripcion = {}, opciones = {}) {
  const segmentos = transcripcion.segmentos || transcripcion.segments || [];
  const subtitulos = generarSubtitulosDesdeSegmentos(segmentos, opciones);
  return {
    ok: true,
    total: subtitulos.length,
    subtitulos,
    creadoEn: new Date().toISOString()
  };
}
