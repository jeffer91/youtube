/*
  Modulo: gemini
  Funcion: validar y normalizar respuestas de Gemini antes de usarlas.
*/

export function extraerJsonSeguro(respuesta) {
  if (!respuesta) return null;
  if (typeof respuesta === 'object') return respuesta;

  const texto = String(respuesta).trim();
  try {
    return JSON.parse(texto);
  } catch (_error) {
    const inicio = texto.indexOf('{');
    const fin = texto.lastIndexOf('}');
    if (inicio >= 0 && fin > inicio) {
      try {
        return JSON.parse(texto.slice(inicio, fin + 1));
      } catch (_errorInterno) {
        return null;
      }
    }
    return null;
  }
}

export function validarRespuestaGemini(respuesta, esquema = {}) {
  const datos = extraerJsonSeguro(respuesta);
  const errores = [];

  if (!datos) errores.push('La respuesta de Gemini no contiene JSON valido.');
  if (datos && esquema.requeridos) {
    esquema.requeridos.forEach((campo) => {
      if (!(campo in datos)) errores.push(`Falta campo requerido: ${campo}`);
    });
  }

  return {
    ok: errores.length === 0,
    datos,
    errores,
    recibidoEn: new Date().toISOString()
  };
}

export function crearRespuestaFallback(tarea, motivo = 'Gemini no respondio con datos validos.') {
  return {
    ok: true,
    fallback: true,
    tarea,
    motivo,
    datos: {},
    creadoEn: new Date().toISOString()
  };
}
