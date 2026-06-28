/*
  Bloque 3 - Normalizador de respuesta IA para Plan
  Función: extraer JSON seguro y convertir cualquier proveedor a un contrato común.
*/

function texto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function arr(valor) {
  return Array.isArray(valor) ? valor : [];
}

export function extraerJsonDesdeTexto(textoRespuesta = '') {
  const contenido = String(textoRespuesta || '').trim();
  if (!contenido) return {};
  try { return JSON.parse(contenido); } catch (_error) {}
  const bloque = contenido.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (bloque) {
    try { return JSON.parse(bloque.trim()); } catch (_error) {}
  }
  const inicio = contenido.indexOf('{');
  const fin = contenido.lastIndexOf('}');
  if (inicio >= 0 && fin > inicio) {
    try { return JSON.parse(contenido.slice(inicio, fin + 1)); } catch (_error) {}
  }
  return { resumenHumano: contenido, jsonTecnico: null };
}

function crearTimelineFallback(contexto = {}) {
  const compacto = contexto.contextoIA?.compacto || contexto.compacto || {};
  const segmentos = arr(contexto.segmentos).length ? contexto.segmentos : arr(compacto.segmentos);
  const momentos = arr(contexto.momentosClave).length ? contexto.momentosClave : arr(compacto.momentosClave);
  const recursos = arr(contexto.recursosPlan).length ? contexto.recursosPlan : arr(compacto.biblioteca?.recursosPlan);
  const base = segmentos.length ? segmentos : momentos;
  if (!base.length) {
    return [{
      inicio: 0,
      fin: Math.min(Number(contexto.resumen?.duracionSegundos || compacto.resumen?.duracionSegundos || 8), 8),
      accion: 'intro_segura',
      textoPantalla: 'Inicio del video',
      recursoBiblioteca: recursos[0]?.id || null,
      efecto: 'corte_limpio',
      audio: 'mantener_audio_original',
      motivo: 'Fallback interno por ausencia de respuesta IA.'
    }];
  }
  return base.slice(0, 12).map((item, index) => ({
    inicio: Number(item.inicio ?? item.inicioGlobal ?? item.segundo ?? index * 5) || 0,
    fin: Number(item.fin ?? item.finGlobal ?? ((Number(item.inicio ?? item.segundo ?? index * 5) || 0) + 4)) || ((index + 1) * 5),
    accion: index === 0 ? 'gancho_inicial' : 'refuerzo_visual',
    textoPantalla: texto(item.texto || item.motivo || item.descripcion, index === 0 ? 'Gancho inicial' : 'Idea clave'),
    recursoBiblioteca: recursos[index % Math.max(recursos.length, 1)]?.id || null,
    efecto: index === 0 ? 'punch_in_suave' : 'corte_limpio',
    audio: 'mantener_audio_original',
    motivo: texto(item.motivo || item.descripcion || 'Acción generada desde contexto absorbido.')
  }));
}

export function crearRespuestaFallbackPlan(contexto = {}, motivo = 'Proveedor IA no disponible') {
  const timeline = crearTimelineFallback(contexto);
  return {
    resumenHumano: [
      'Plan base generado por fallback interno.',
      'Usa el contexto absorbido del Entendimiento y referencias de Biblioteca.',
      motivo
    ].join(' '),
    jsonTecnico: {
      version: '1.0.0',
      origen: 'fallback-interno',
      timeline,
      recursos: timeline.map((item) => item.recursoBiblioteca).filter(Boolean),
      validacion: {
        ok: timeline.length > 0,
        errores: [],
        advertencias: [motivo],
        compatibleProduccion: true
      }
    }
  };
}

export function normalizarRespuestaPlanIA({ proveedor = 'desconocido', modelo = '', respuesta = {}, textoOriginal = '', contexto = {}, real = false, fallback = false, motivo = '' } = {}) {
  const data = typeof respuesta === 'string' ? extraerJsonDesdeTexto(respuesta) : respuesta;
  const base = data && Object.keys(data).length ? data : crearRespuestaFallbackPlan(contexto, motivo || 'Respuesta vacía de IA');
  const resumenHumano = texto(base.resumenHumano || base.resumen || base.lectura || base.explicacion, 'Plan generado por IA.');
  const jsonTecnico = base.jsonTecnico || base.planEjecutable || base.plan || base.timeline ? {
    ...(base.jsonTecnico || base.planEjecutable || base.plan || {}),
    timeline: arr(base.jsonTecnico?.timeline || base.planEjecutable?.timeline || base.plan?.timeline || base.timeline)
  } : crearRespuestaFallbackPlan(contexto, 'La IA no devolvió JSON técnico.').jsonTecnico;
  const valido = Boolean(resumenHumano && arr(jsonTecnico.timeline).length);

  return {
    ok: valido,
    proveedor,
    modelo,
    real,
    fallback,
    motivo,
    resumenHumano,
    jsonTecnico,
    data: base,
    textoOriginal,
    validacion: {
      ok: valido,
      errores: valido ? [] : ['La respuesta IA no incluye timeline ejecutable.'],
      advertencias: fallback ? [motivo || 'Respuesta generada por fallback.'] : [],
      compatibleProduccion: valido
    },
    creadoEn: new Date().toISOString()
  };
}
