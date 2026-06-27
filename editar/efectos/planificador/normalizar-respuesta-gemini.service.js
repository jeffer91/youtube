/*
  Bloque 6: Selector Gemini de efectos
  Funcion: convertir la respuesta de Gemini en un plan seguro compatible con el validador local.
*/

import { buscarEfectoPorId } from '../catalogo/index.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function limpiarTexto(valor = '') {
  return String(valor || '').replace(/\s+/g, ' ').trim().slice(0, 64);
}

function buscarMomento(contexto = {}, momentoId = '') {
  const momentos = Array.isArray(contexto?.momentos?.momentos) ? contexto.momentos.momentos : [];
  return momentos.find((item) => item.id === momentoId) || null;
}

function extraerListaEfectos(data = {}) {
  if (Array.isArray(data?.efectos)) return data.efectos;
  if (Array.isArray(data?.datos?.efectos)) return data.datos.efectos;
  if (Array.isArray(data?.seleccion)) return data.seleccion;
  return [];
}

export function normalizarRespuestaEfectosGemini({ respuesta = null, contexto = {}, maxEfectos = 12 } = {}) {
  const data = respuesta?.data || respuesta || {};
  const errores = [];
  const advertencias = [];
  const lista = extraerListaEfectos(data).slice(0, Math.max(1, numero(maxEfectos, 12)));
  const usados = new Set();

  const efectos = lista.map((item, index) => {
    const efectoId = String(item.efectoId || item.id || item.efecto || '').trim();
    const efecto = buscarEfectoPorId(efectoId);
    const momento = buscarMomento(contexto, item.momentoId || item.momento || '');
    const inicio = numero(item.inicio, momento?.inicio ?? index * 3);
    const fin = numero(item.fin, momento?.fin ?? inicio + 1.8);

    if (!efecto) {
      advertencias.push(`Gemini sugirio un efecto no existente: ${efectoId}`);
      return null;
    }
    if (usados.has(`${efectoId}-${inicio.toFixed(2)}`)) return null;
    usados.add(`${efectoId}-${inicio.toFixed(2)}`);

    return {
      idPlan: `gemini-${index + 1}`,
      efectoId: efecto.id,
      nombre: efecto.nombre,
      categoria: efecto.categoria,
      inicio,
      fin,
      intensidad: item.intensidad || contexto?.intensidad?.id || 'normal',
      texto: limpiarTexto(item.texto || momento?.texto || ''),
      prioridad: numero(item.prioridad, 30 + index),
      origen: 'gemini',
      motivo: limpiarTexto(item.motivo || 'Seleccionado por Gemini.')
    };
  }).filter(Boolean);

  if (lista.length === 0) errores.push('Gemini no devolvio una lista de efectos.');
  if (efectos.length === 0) errores.push('No quedaron efectos Gemini validos luego de normalizar.');

  return {
    ok: errores.length === 0,
    origen: 'gemini',
    errores,
    advertencias,
    total: efectos.length,
    efectos,
    resumen: data.resumen || data.datos?.resumen || '',
    mensaje: errores.length === 0 ? `Gemini selecciono ${efectos.length} efectos.` : 'Respuesta Gemini sin efectos validos.'
  };
}

export default normalizarRespuestaEfectosGemini;
