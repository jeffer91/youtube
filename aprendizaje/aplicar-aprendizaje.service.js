/*
  Modulo: aprendizaje
  Funcion: aplicar reglas aprendidas a nuevas sugerencias.
*/

import { cargarMemoriaEdicion, guardarMemoriaEdicion } from './memoria-edicion.service.js';

function textoCoincide(regla = {}, contexto = {}) {
  const base = [contexto.tema, contexto.frase, contexto.texto].filter(Boolean).join(' ').toLowerCase();
  const tema = String(regla.tema || '').toLowerCase();
  const frase = String(regla.frase || '').toLowerCase();
  if (!tema && !frase) return true;
  return Boolean((tema && base.includes(tema)) || (frase && base.includes(frase.slice(0, 40))));
}

export async function obtenerReglasAplicables(contexto = {}, opciones = {}) {
  const memoria = await cargarMemoriaEdicion(opciones);
  return memoria.reglas.filter((regla) => {
    if (!regla.activa) return false;
    if (contexto.perfil && regla.perfil !== contexto.perfil) return false;
    return textoCoincide(regla, contexto);
  });
}

export async function aplicarAprendizajeASugerencias(sugerencias = [], contexto = {}, opciones = {}) {
  const reglas = await obtenerReglasAplicables(contexto, opciones);
  return sugerencias.map((sugerencia) => {
    const regla = reglas.find((item) => item.recursoElegido?.tipo === sugerencia.tipo || item.tipo === sugerencia.tipo);
    if (!regla) return sugerencia;
    return {
      ...sugerencia,
      aprendizajeAplicado: true,
      reglaAprendizajeId: regla.id,
      prioridad: 'alta',
      motivoAprendizaje: regla.regla || regla.motivo
    };
  });
}

export async function registrarUsoRegla(reglaId, opciones = {}) {
  const memoria = await cargarMemoriaEdicion(opciones);
  const reglas = memoria.reglas.map((regla) => regla.id === reglaId
    ? { ...regla, vecesAplicada: Number(regla.vecesAplicada || 0) + 1, actualizadoEn: new Date().toISOString() }
    : regla);
  return guardarMemoriaEdicion({ reglas }, opciones);
}
