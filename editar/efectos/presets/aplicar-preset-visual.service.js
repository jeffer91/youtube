/*
  Bloque 14: Presets visuales por perfil
  Función: aplicar estilo visual por perfil antes del aprendizaje y optimización.
*/

import { buscarEfectoPorId } from '../catalogo/index.js';
import { obtenerPresetVisualEfectos } from './presets-visuales.config.js';

function unico(lista = []) {
  return [...new Set(lista.filter(Boolean))];
}

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function obtenerPerfilId(contexto = {}, opciones = {}) {
  return String(opciones?.perfil || contexto?.perfil?.id || 'general').trim().toLowerCase() || 'general';
}

function tieneValor(valor) {
  return valor !== undefined && valor !== null && String(valor).trim() !== '';
}

export function aplicarPresetVisualAContexto(contexto = {}, opciones = {}) {
  const preset = obtenerPresetVisualEfectos(obtenerPerfilId(contexto, opciones));
  const opcionesPreset = {
    ...opciones,
    selectorEfectos: opciones.selectorEfectos || preset.selectorDefault,
    motorEfectosIA: opciones.motorEfectosIA || opciones.selectorEfectos || preset.selectorDefault,
    intensidadEfectos: opciones.intensidadEfectos || preset.intensidadDefault,
    maxEfectosVisuales: tieneValor(opciones.maxEfectosVisuales) ? opciones.maxEfectosVisuales : preset.maxEfectosDefault
  };

  const contextoPreset = {
    ...contexto,
    presetVisual: preset,
    perfil: {
      ...(contexto.perfil || {}),
      id: contexto?.perfil?.id || preset.id,
      nombre: contexto?.perfil?.nombre || preset.nombre,
      categoriasPrioritarias: unico([...(contexto?.perfil?.categoriasPrioritarias || []), ...(preset.categoriasPrioritarias || [])]),
      maxEfectosPorVideo: numero(contexto?.perfil?.maxEfectosPorVideo, preset.maxEfectosDefault)
    },
    necesidades: unico([...(contexto.necesidades || []), ...(preset.necesidadesVisuales || [])])
  };

  return { contexto: contextoPreset, opciones: opcionesPreset, presetVisual: preset };
}

function crearEfectoPreset(efectoId, index = 0, preset = {}, contexto = {}) {
  const efecto = buscarEfectoPorId(efectoId);
  if (!efecto) return null;
  const duracion = numero(contexto?.duracionSegundos, 30);
  const inicio = Math.max(0, Math.min(duracion - 1, 0.6 + index * 4.2));
  const esBase = (preset.efectosBase || []).includes(efectoId);
  return {
    idPlan: `preset-${preset.id || 'general'}-${index + 1}`,
    efectoId: efecto.id,
    nombre: efecto.nombre,
    categoria: efecto.categoria,
    inicio,
    fin: Math.min(duracion, inicio + (efecto.categoria === 'texto' ? 2.2 : 3.2)),
    intensidad: contexto?.intensidad?.id || preset.intensidadDefault || 'normal',
    texto: '',
    prioridad: esBase ? 18 + index : 32 + index,
    origen: 'preset-visual',
    motivo: `Efecto sugerido por preset visual ${preset.nombre || preset.id}.`
  };
}

export function aplicarPresetVisualASeleccion(seleccion = {}, contexto = {}, opciones = {}) {
  const preset = contexto.presetVisual || obtenerPresetVisualEfectos(obtenerPerfilId(contexto, opciones));
  const bloqueados = new Set(preset.efectosBloqueados || []);
  const actuales = Array.isArray(seleccion.efectos) ? seleccion.efectos : [];
  const idsActuales = new Set(actuales.map((item) => item.efectoId || item.id || item.efecto));
  const maxEfectos = Math.max(1, numero(opciones.maxEfectosVisuales || contexto?.perfil?.maxEfectosPorVideo || preset.maxEfectosDefault, preset.maxEfectosDefault));

  const filtrados = actuales.filter((item) => !bloqueados.has(item.efectoId || item.id || item.efecto));
  const candidatosPreset = [...(preset.efectosBase || []), ...(preset.efectosPrioritarios || [])]
    .filter((id) => !idsActuales.has(id) && !bloqueados.has(id))
    .map((id, index) => crearEfectoPreset(id, index, preset, contexto))
    .filter(Boolean);

  const efectos = [...candidatosPreset, ...filtrados].slice(0, maxEfectos);
  const omitidos = actuales.length - filtrados.length;

  return {
    ...seleccion,
    presetVisualAplicado: preset.id,
    efectos,
    total: efectos.length,
    advertencias: [
      ...(seleccion.advertencias || []),
      ...(omitidos > 0 ? [`Preset visual bloqueó ${omitidos} efecto(s) no recomendados para ${preset.id}.`] : [])
    ],
    mensaje: `${seleccion.mensaje || 'Selección de efectos.'} Preset visual ${preset.nombre} aplicado.`
  };
}

export default aplicarPresetVisualASeleccion;
