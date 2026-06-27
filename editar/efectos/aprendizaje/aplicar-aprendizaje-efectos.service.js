/*
  Bloque 13: Aprendizaje de efectos por perfil
  Función: ajustar el plan antes de optimizar usando la memoria local de efectos.
*/

import { buscarEfectoPorId } from '../catalogo/index.js';
import { cargarMemoriaEfectos, obtenerRegistroPerfil } from './memoria-efectos.service.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function obtenerPerfilId(contexto = {}, seleccion = {}) {
  return String(contexto?.perfil?.id || seleccion?.perfil || 'general').trim().toLowerCase() || 'general';
}

function calcularAjuste(registro = {}) {
  const usos = numero(registro.usos, 0);
  const aplicados = numero(registro.aplicados, 0);
  const omitidos = numero(registro.omitidos, 0);
  const advertencias = numero(registro.advertencias, 0);
  const puntajeBase = numero(registro.puntaje, 0);
  return Math.max(-18, Math.min(18, puntajeBase + aplicados * 1.5 + usos * 0.5 - omitidos * 2 - advertencias * 0.6));
}

function ajustarEfectosSeleccionados(efectos = [], registroPerfil = {}) {
  return efectos.map((efecto) => {
    const efectoId = efecto.efectoId || efecto.id || efecto.efecto;
    const registro = registroPerfil.efectos?.[efectoId];
    if (!registro) return efecto;
    const ajuste = calcularAjuste(registro);
    return {
      ...efecto,
      prioridad: numero(efecto.prioridad, 50) - ajuste,
      aprendizajeEfectos: {
        aplicado: true,
        ajuste,
        usos: registro.usos,
        aplicados: registro.aplicados,
        omitidos: registro.omitidos
      },
      motivo: `${efecto.motivo || 'Seleccionado por motor.'} Aprendizaje perfil: ${ajuste >= 0 ? '+' : ''}${ajuste.toFixed(1)}.`
    };
  });
}

function efectosFavoritos(registroPerfil = {}, efectosActuales = [], limite = 3) {
  const usados = new Set(efectosActuales.map((efecto) => efecto.efectoId || efecto.id || efecto.efecto));
  return Object.values(registroPerfil.efectos || {})
    .map((registro) => ({ registro, ajuste: calcularAjuste(registro) }))
    .filter((item) => item.ajuste >= 4 && !usados.has(item.registro.efectoId) && buscarEfectoPorId(item.registro.efectoId))
    .sort((a, b) => b.ajuste - a.ajuste)
    .slice(0, limite)
    .map((item, index) => {
      const catalogo = buscarEfectoPorId(item.registro.efectoId);
      return {
        idPlan: `aprendizaje-${index + 1}`,
        efectoId: catalogo.id,
        nombre: catalogo.nombre,
        categoria: catalogo.categoria,
        inicio: 1 + index * 5,
        fin: 3 + index * 5,
        intensidad: 'normal',
        texto: '',
        prioridad: 40 - item.ajuste,
        origen: 'aprendizaje',
        motivo: `Efecto sugerido por memoria del perfil. Ajuste ${item.ajuste.toFixed(1)}.`
      };
    });
}

export async function aplicarAprendizajeEfectos(seleccion = {}, contexto = {}, opciones = {}) {
  if (opciones?.usarAprendizajeEfectos === false) return seleccion;

  const memoria = await cargarMemoriaEfectos(opciones);
  const perfilId = obtenerPerfilId(contexto, seleccion);
  const registroPerfil = obtenerRegistroPerfil(memoria, perfilId);
  const efectosBase = Array.isArray(seleccion?.efectos) ? seleccion.efectos : [];
  const ajustados = ajustarEfectosSeleccionados(efectosBase, registroPerfil);
  const maxEfectos = Math.max(1, numero(opciones?.maxEfectosVisuales || contexto?.perfil?.maxEfectosPorVideo, 12));
  const favoritos = efectosFavoritos(registroPerfil, ajustados, Math.max(0, maxEfectos - ajustados.length));
  const efectos = [...ajustados, ...favoritos].slice(0, maxEfectos);

  return {
    ...seleccion,
    aprendizajeAplicado: true,
    memoriaPerfil: perfilId,
    totalFavoritosAgregados: favoritos.length,
    efectos,
    advertencias: [
      ...(seleccion?.advertencias || []),
      ...(favoritos.length ? [`Aprendizaje agregó ${favoritos.length} efecto(s) favorito(s) del perfil.`] : [])
    ],
    mensaje: `${seleccion?.mensaje || 'Selección de efectos.'} Aprendizaje aplicado para ${perfilId}.`
  };
}

export default aplicarAprendizajeEfectos;
