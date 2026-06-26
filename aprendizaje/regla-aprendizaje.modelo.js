/*
  Modulo: aprendizaje
  Funcion: modelo de regla aprendida desde correcciones de Jeff.
*/

import { APRENDIZAJE_CONFIG } from './aprendizaje.config.js';

export function crearIdRegla(prefijo = 'regla') {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function crearReglaAprendizaje(datos = {}) {
  return {
    id: datos.id || crearIdRegla(),
    tipo: datos.tipo || APRENDIZAJE_CONFIG.tipos.correccionManual,
    perfil: datos.perfil || 'general',
    tema: datos.tema || '',
    frase: datos.frase || datos.fraseRelacionada || '',
    recursoRechazado: datos.recursoRechazado || null,
    recursoElegido: datos.recursoElegido || null,
    motivo: datos.motivo || '',
    regla: datos.regla || '',
    impacto: datos.impacto || APRENDIZAJE_CONFIG.impacto.medio,
    vecesAplicada: Number(datos.vecesAplicada || 0),
    activa: datos.activa !== false,
    creadoEn: datos.creadoEn || new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

export function validarReglaAprendizaje(regla = {}) {
  const errores = [];
  if (!regla.id) errores.push('La regla no tiene id.');
  if (!regla.perfil) errores.push('La regla no tiene perfil.');
  if (!regla.tipo) errores.push('La regla no tiene tipo.');
  if (!regla.regla && !regla.motivo) errores.push('La regla necesita descripcion o motivo.');
  return { ok: errores.length === 0, errores, regla };
}
