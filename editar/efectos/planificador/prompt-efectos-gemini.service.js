/*
  Bloque 6: Selector Gemini de efectos
  Funcion: construir una tarea controlada para que Gemini escoja solo efectos del catalogo.
*/

function resumirEfectosDisponibles(contexto = {}) {
  const ids = Array.isArray(contexto.idsEfectosCompatibles) ? contexto.idsEfectosCompatibles : [];
  return ids.slice(0, 80).map((id) => ({ id }));
}

function resumirMomentos(contexto = {}) {
  const momentos = Array.isArray(contexto?.momentos?.momentos) ? contexto.momentos.momentos : [];
  return momentos.slice(0, 18).map((momento) => ({
    id: momento.id,
    inicio: momento.inicio,
    fin: momento.fin,
    texto: momento.texto,
    prioridad: momento.prioridad,
    origen: momento.origen
  }));
}

export function construirTareaEfectosGemini(contexto = {}, { maxEfectos = 12 } = {}) {
  return {
    tarea: 'seleccionar_efectos_video',
    perfil: contexto.perfil,
    instrucciones: [
      'Selecciona efectos visuales para un video de AutoVideoJeff.',
      'Usa solamente ids de efectos incluidos en efectosDisponibles.',
      'No inventes efectos nuevos.',
      'No uses efectos que requieran texto si no hay texto o transcripcion disponible.',
      'Respeta el perfil, la intensidad y las necesidades visuales.',
      'Devuelve JSON valido con esta forma exacta: {"efectos":[{"efectoId":"id","momentoId":"id","inicio":0,"fin":2,"intensidad":"normal","texto":"","prioridad":50,"motivo":""}],"resumen":""}.',
      `Maximo de efectos: ${maxEfectos}.`
    ],
    payload: {
      perfil: contexto.perfil,
      intensidad: contexto.intensidad,
      duracionSegundos: contexto.duracionSegundos,
      tipoDuracion: contexto.tipoDuracion,
      plataforma: contexto.plataforma,
      formato: contexto.formato,
      tieneTranscripcion: contexto.tieneTranscripcion,
      tieneTextosFlotantes: contexto.tieneTextosFlotantes,
      edicionDinamicaActiva: contexto.edicionDinamicaActiva,
      necesidades: contexto.necesidades,
      maxEfectos,
      efectosDisponibles: resumirEfectosDisponibles(contexto),
      momentos: resumirMomentos(contexto)
    }
  };
}

export default construirTareaEfectosGemini;
