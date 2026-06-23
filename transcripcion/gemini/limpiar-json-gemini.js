function extraerTextoCandidato(respuesta) {
  if (typeof respuesta === 'string') return respuesta;
  if (respuesta && typeof respuesta === 'object') {
    if (typeof respuesta.texto === 'string') return respuesta.texto;
    if (typeof respuesta.text === 'string') return respuesta.text;
    if (typeof respuesta.output === 'string') return respuesta.output;
    const parte = respuesta?.candidates?.[0]?.content?.parts?.find((item) => typeof item?.text === 'string');
    if (parte?.text) return parte.text;
  }
  return '';
}

function limpiarMarcadores(texto) {
  return String(texto || '').replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

function buscarBloqueJson(texto) {
  const limpio = limpiarMarcadores(texto);
  if (!limpio) return '';
  if (limpio.startsWith('{') && limpio.endsWith('}')) return limpio;
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (inicio >= 0 && fin > inicio) return limpio.slice(inicio, fin + 1);
  return limpio;
}

export function limpiarJsonGemini(respuesta) {
  const textoOriginal = extraerTextoCandidato(respuesta);
  const textoJson = buscarBloqueJson(textoOriginal);
  if (!textoJson) return { ok: false, data: null, textoOriginal, textoJson: '', error: 'No se encontró JSON.' };
  try {
    const data = JSON.parse(textoJson);
    return { ok: true, data, textoOriginal, textoJson, error: null };
  } catch (error) {
    return { ok: false, data: null, textoOriginal, textoJson, error: `JSON inválido: ${error.message}` };
  }
}

export function obtenerTextoGeminiDesdeRespuestaApi(respuestaApi) {
  const partes = respuestaApi?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(partes)) return '';
  return partes.map((parte) => parte?.text || '').filter(Boolean).join('\n').trim();
}

export default limpiarJsonGemini;
