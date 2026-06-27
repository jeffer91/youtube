/*
  Nueva etapa estructural - Bloque 2
  Función: construir un contexto fijo y completo para todas las tareas de Gemini.
*/

function resumenCorto(valor, maximo = 900) {
  const texto = String(valor || '').replace(/\s+/g, ' ').trim();
  if (texto.length <= maximo) return texto;
  return `${texto.slice(0, maximo)}...`;
}

function obtenerPayload(tarea = {}) {
  return tarea.payload || {};
}

function extraerTranscripcion(payload = {}) {
  const transcripcion = payload.transcripcion || payload.reporteEntendimiento?.resumen?.transcripcion || {};
  return transcripcion.textoCompleto || transcripcion.texto || payload.textoCompleto || '';
}

function extraerMomentos(payload = {}) {
  return payload.momentosClave || payload.reporteEntendimiento?.resumen?.momentosClave || payload.contexto?.momentosClave || [];
}

function extraerFotogramas(payload = {}) {
  return payload.fotogramas?.fotogramas || payload.reporteEntendimiento?.resumen?.fotogramas || [];
}

function extraerEfectos(payload = {}) {
  return payload.efectosDisponibles || payload.catalogoEfectos || payload.efectosPermitidos || [];
}

function formatearLista(lista = [], maximo = 10, mapper = (item) => item) {
  if (!Array.isArray(lista) || lista.length === 0) return 'Sin datos disponibles todavía.';
  return lista.slice(0, maximo).map((item, index) => `${index + 1}. ${mapper(item)}`).join('\n');
}

export function construirContextoEditorialGemini(tarea = {}, opciones = {}) {
  const payload = obtenerPayload(tarea);
  const perfil = payload.perfil?.id || payload.perfil || tarea.perfil?.id || tarea.perfil || opciones.perfil || 'general';
  const plataforma = payload.plataforma || payload.proyecto?.plataforma || opciones.plataforma || 'tiktok';
  const transcripcion = extraerTranscripcion(payload);
  const momentos = extraerMomentos(payload);
  const fotogramas = extraerFotogramas(payload);
  const efectos = extraerEfectos(payload);
  const recursos = payload.biblioteca || payload.recursos || [];

  return [
    'CONTEXTO EDITORIAL FIJO:',
    'Eres un editor profesional de video para AutoVideoJeff.',
    'Tu trabajo es ayudar a crear videos para redes sociales con ganchos visuales, títulos, subtítulos, imágenes, animaciones, efectos, ritmo y claridad.',
    'No respondas como asistente general: responde como editor de video.',
    `Perfil de edición: ${perfil}.`,
    `Plataforma principal: ${plataforma}.`,
    'Objetivo: entender primero el video y luego proponer edición útil, visible y modificable en Producción.',
    '',
    'LO QUE TENEMOS DEL VIDEO:',
    `Transcripción disponible: ${transcripcion ? resumenCorto(transcripcion, 1200) : 'No hay transcripción real todavía. Si falta, pide o sugiere transcripción antes de títulos precisos.'}`,
    'Momentos importantes detectados:',
    formatearLista(momentos, 8, (item) => `${item.inicio ?? 0}s-${item.fin ?? ''}s · ${item.tipo || 'momento'} · ${item.motivo || item.texto || 'sin detalle'}`),
    'Fotogramas analizados:',
    Array.isArray(fotogramas) ? formatearLista(fotogramas, 8, (item) => `${item.segundo ?? '-'}s · ${item.nombreArchivo || item.id || 'frame'}`) : JSON.stringify(fotogramas),
    'Recursos disponibles:',
    formatearLista(recursos, 8, (item) => `${item.nombre || item.titulo || item.tipo || 'recurso'} · ${item.categoria || 'sin categoria'}`),
    'Efectos permitidos:',
    formatearLista(efectos, 20, (item) => item.id || item.efectoId || item.nombre || String(item)),
    '',
    'REGLAS DE EDICIÓN:',
    '- Propón textos cortos, títulos claros y hooks visuales fuertes.',
    '- No inventes efectos fuera del catálogo permitido.',
    '- Si falta transcripción, marca la decisión como pendiente y no inventes frases exactas.',
    '- Si sugieres imágenes o recursos, indica tipo, motivo, categoría, tono y dónde irían en la línea de tiempo.',
    '- La respuesta debe ser JSON válido.'
  ].join('\n');
}

export default construirContextoEditorialGemini;
