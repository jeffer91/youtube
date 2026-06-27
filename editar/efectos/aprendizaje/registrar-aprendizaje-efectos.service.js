/*
  Bloque 13: Aprendizaje de efectos por perfil
  Función: aprender de cada render y actualizar preferencia por perfil/efecto.
*/

import { cargarMemoriaEfectos, guardarMemoriaEfectos, obtenerRegistroPerfil, obtenerRegistroEfecto } from './memoria-efectos.service.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function obtenerPerfil(resultado = {}) {
  return String(resultado?.plan?.perfil?.id || resultado?.detalle?.perfil || 'general').trim().toLowerCase() || 'general';
}

function efectosPlan(resultado = {}) {
  return Array.isArray(resultado?.plan?.efectos) ? resultado.plan.efectos : [];
}

function idsOmitidos(resultado = {}) {
  const omitidos = Array.isArray(resultado?.compilado?.omitidos) ? resultado.compilado.omitidos : [];
  return new Set(omitidos.map((item) => item?.efecto?.efectoId || item?.efecto?.id || item?.efectoId || '').filter(Boolean));
}

function actualizarCategoria(registroPerfil, categoria = '') {
  if (!categoria) return;
  if (!registroPerfil.categorias[categoria]) registroPerfil.categorias[categoria] = { categoria, usos: 0, puntaje: 0, actualizadoEn: null };
  registroPerfil.categorias[categoria].usos += 1;
  registroPerfil.categorias[categoria].puntaje += 1;
  registroPerfil.categorias[categoria].actualizadoEn = new Date().toISOString();
}

export async function registrarAprendizajeEfectos(resultado = {}, opciones = {}) {
  if (!resultado || resultado.omitido) return { ok: false, omitido: true, mensaje: 'No se registra aprendizaje porque el motor fue omitido.' };

  const memoria = await cargarMemoriaEfectos(opciones);
  const perfilId = obtenerPerfil(resultado);
  const registroPerfil = obtenerRegistroPerfil(memoria, perfilId);
  const omitidos = idsOmitidos(resultado);
  const efectos = efectosPlan(resultado);
  const origen = resultado?.plan?.origen || resultado?.detalle?.origen || 'local';
  const ahora = new Date().toISOString();

  registroPerfil.totalProcesos = numero(registroPerfil.totalProcesos, 0) + 1;
  registroPerfil.actualizadoEn = ahora;
  memoria.global.totalProcesos = numero(memoria.global.totalProcesos, 0) + 1;

  for (const efecto of efectos) {
    const efectoId = efecto.efectoId || efecto.id || efecto.efecto;
    if (!efectoId) continue;
    const registro = obtenerRegistroEfecto(registroPerfil, efectoId);
    const fueOmitido = omitidos.has(efectoId);
    const tuvoAdvertencia = (resultado?.plan?.advertencias || []).some((texto) => String(texto).includes(efectoId));

    registro.usos += 1;
    registro.aplicados += fueOmitido ? 0 : 1;
    registro.omitidos += fueOmitido ? 1 : 0;
    registro.advertencias += tuvoAdvertencia ? 1 : 0;
    registro.puntaje += fueOmitido ? -2 : 1;
    registro.ultimaCategoria = efecto.categoria || registro.ultimaCategoria || '';
    registro.ultimoOrigen = origen;
    registro.ultimoMensaje = efecto.motivo || resultado.mensaje || '';
    registro.actualizadoEn = ahora;
    actualizarCategoria(registroPerfil, efecto.categoria);
  }

  const guardada = await guardarMemoriaEfectos(memoria, opciones);
  return {
    ok: true,
    perfil: perfilId,
    efectosRegistrados: efectos.length,
    totalProcesosPerfil: registroPerfil.totalProcesos,
    totalProcesosGlobal: guardada.global.totalProcesos,
    mensaje: `Aprendizaje de efectos actualizado para ${perfilId}.`
  };
}

export default registrarAprendizajeEfectos;
