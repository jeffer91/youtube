/*
  Modulo: biblioteca
  Funcion: modelo normalizado de recursos visuales y sonoros.
*/

import { BIBLIOTECA_CONFIG, obtenerTiposBiblioteca } from './biblioteca.config.js';
import { obtenerCategoriaBiblioteca } from './categorias.config.js';

export function crearIdRecurso(prefijo = 'recurso') {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function limpiarNombreRecurso(nombre = '') {
  return String(nombre || 'recurso')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'recurso';
}

export function crearRecursoModelo(datos = {}) {
  const tipo = obtenerTiposBiblioteca().includes(datos.tipo) ? datos.tipo : BIBLIOTECA_CONFIG.tipos.imagen;
  const categoria = obtenerCategoriaBiblioteca(datos.categoria || 'general');
  const nombre = datos.nombre || datos.titulo || 'Recurso sin nombre';

  return {
    id: datos.id || crearIdRecurso(limpiarNombreRecurso(nombre)),
    nombre,
    nombreArchivo: datos.nombreArchivo || `${limpiarNombreRecurso(nombre)}`,
    descripcion: datos.descripcion || '',
    tipo,
    categoria: categoria.id,
    perfil: datos.perfil || null,
    etiquetas: Array.isArray(datos.etiquetas) ? datos.etiquetas : [],
    tema: datos.tema || '',
    fraseRelacionada: datos.fraseRelacionada || '',
    ruta: datos.ruta || '',
    url: datos.url || '',
    fuente: datos.fuente || 'biblioteca',
    licencia: datos.licencia || BIBLIOTECA_CONFIG.licenciaPorDefecto,
    estado: datos.estado || BIBLIOTECA_CONFIG.estados.pendiente,
    aprobado: datos.aprobado === true,
    rechazado: datos.rechazado === true,
    uso: datos.uso || { total: 0, proyectos: [] },
    creadoEn: datos.creadoEn || new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

export function validarRecursoModelo(recurso = {}) {
  const errores = [];
  if (!recurso.id) errores.push('El recurso no tiene id.');
  if (!recurso.nombre) errores.push('El recurso no tiene nombre.');
  if (!obtenerTiposBiblioteca().includes(recurso.tipo)) errores.push(`Tipo de recurso no soportado: ${recurso.tipo}`);
  if (!recurso.ruta && !recurso.url) errores.push('El recurso debe tener ruta local o url.');
  return { ok: errores.length === 0, errores, recurso };
}
