/*
  Modulo: proyectos
  Funcion: modelo normalizado de un proyecto de edicion.
*/

import { PROYECTOS_CONFIG, obtenerEstadosProyecto, obtenerModosEdicionProyecto } from './proyectos.config.js';

export function crearIdProyecto(prefijo = 'proyecto') {
  const fecha = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const aleatorio = Math.random().toString(36).slice(2, 8);
  return `${prefijo}-${fecha}-${aleatorio}`;
}

export function limpiarNombreProyecto(nombre = '') {
  const limpio = String(nombre || 'nuevo-proyecto')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return limpio || 'nuevo-proyecto';
}

export function crearProyectoModelo(datos = {}) {
  const ahora = new Date().toISOString();
  const nombre = datos.nombre || datos.titulo || 'Nuevo proyecto';
  const id = datos.id || crearIdProyecto(limpiarNombreProyecto(nombre).toLowerCase());

  return {
    id,
    nombre,
    descripcion: datos.descripcion || '',
    estado: datos.estado || PROYECTOS_CONFIG.estados.CREADO,
    perfil: datos.perfil || PROYECTOS_CONFIG.perfilPorDefecto,
    modoEdicion: datos.modoEdicion || PROYECTOS_CONFIG.modoEdicion.AUTOMATICO_RAPIDO,
    plataformas: Array.isArray(datos.plataformas) && datos.plataformas.length > 0
      ? datos.plataformas
      : [...PROYECTOS_CONFIG.plataformasPorDefecto],
    funciones: {
      limpiarAudio: datos.funciones?.limpiarAudio !== false,
      subtitulos: datos.funciones?.subtitulos !== false,
      textosRelevantes: datos.funciones?.textosRelevantes !== false,
      animaciones: datos.funciones?.animaciones !== false,
      efectos: datos.funciones?.efectos !== false,
      biblioteca: datos.funciones?.biblioteca !== false,
      gemini: datos.funciones?.gemini !== false,
      produccion: datos.funciones?.produccion !== false
    },
    rutas: datos.rutas || {},
    bibliotecaProyecto: datos.bibliotecaProyecto || [],
    exportaciones: datos.exportaciones || [],
    diagnostico: datos.diagnostico || [],
    creadoEn: datos.creadoEn || ahora,
    actualizadoEn: ahora
  };
}

export function validarProyectoBase(proyecto = {}) {
  const errores = [];
  if (!proyecto.id) errores.push('El proyecto no tiene id.');
  if (!proyecto.nombre) errores.push('El proyecto no tiene nombre.');
  if (!obtenerEstadosProyecto().includes(proyecto.estado)) errores.push(`Estado de proyecto invalido: ${proyecto.estado}`);
  if (!obtenerModosEdicionProyecto().includes(proyecto.modoEdicion)) errores.push(`Modo de edicion invalido: ${proyecto.modoEdicion}`);
  if (!Array.isArray(proyecto.plataformas) || proyecto.plataformas.length === 0) errores.push('El proyecto debe tener al menos una plataforma.');
  return { ok: errores.length === 0, errores };
}

export function normalizarProyecto(datos = {}) {
  const proyecto = crearProyectoModelo(datos);
  const validacion = validarProyectoBase(proyecto);
  if (!validacion.ok) {
    const error = new Error(validacion.errores.join(' '));
    error.errores = validacion.errores;
    throw error;
  }
  return proyecto;
}
