/*
  Modulo: biblioteca
  Funcion: resolver y crear carpetas internas de biblioteca general y biblioteca de proyecto.
*/

import fs from 'fs';
import path from 'path';
import { obtenerRutaDatos, crearRutaRelativaParaWeb, asegurarCarpeta } from '../comun/archivos.js';
import { BIBLIOTECA_CONFIG } from './biblioteca.config.js';
import { normalizarCategoriaBiblioteca } from './categorias.config.js';
import { normalizarEstiloVideo } from './estilos-video.config.js';

function normalizarId(valor = 'recurso') {
  return String(valor || 'recurso')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'recurso';
}

export function obtenerRutaBibliotecaRaiz() {
  return path.join(obtenerRutaDatos(), BIBLIOTECA_CONFIG.carpetaRaiz);
}

export function obtenerRutasBibliotecaGeneral() {
  const raiz = obtenerRutaDatos();
  const biblioteca = obtenerRutaBibliotecaRaiz();
  const general = path.join(raiz, BIBLIOTECA_CONFIG.carpetaGeneral);
  const archivos = path.join(raiz, BIBLIOTECA_CONFIG.carpetaArchivosGeneral);

  return {
    raizDatos: raiz,
    biblioteca,
    general,
    archivos,
    indice: path.join(general, BIBLIOTECA_CONFIG.archivoIndiceGeneral),
    categoriasEditables: path.join(biblioteca, BIBLIOTECA_CONFIG.archivoCategoriasEditables),
    estilosEditables: path.join(biblioteca, BIBLIOTECA_CONFIG.archivoEstilosEditables)
  };
}

export function asegurarEstructuraBibliotecaGeneral() {
  const rutas = obtenerRutasBibliotecaGeneral();
  asegurarCarpeta(rutas.biblioteca);
  asegurarCarpeta(rutas.general);
  asegurarCarpeta(rutas.archivos);
  return rutas;
}

export function obtenerCarpetaDestinoRecursoGeneral({ estilos = [], categoria = 'otro' } = {}) {
  const rutas = asegurarEstructuraBibliotecaGeneral();
  const estiloPrincipal = normalizarEstiloVideo(Array.isArray(estilos) ? estilos[0] : estilos || 'general');
  const categoriaId = normalizarCategoriaBiblioteca(categoria);
  return path.join(rutas.archivos, estiloPrincipal, categoriaId);
}

export function obtenerRutasBibliotecaProyecto(proyecto = {}) {
  const raizProyecto = proyecto?.rutas?.raiz || proyecto?.rutas?.carpetaProyecto || proyecto?.carpetaProyecto || proyecto?.ruta || null;
  if (!raizProyecto) throw new Error('No se puede resolver biblioteca proyecto sin ruta del proyecto.');

  const biblioteca = path.join(raizProyecto, BIBLIOTECA_CONFIG.carpetaProyecto);
  const archivos = path.join(raizProyecto, BIBLIOTECA_CONFIG.carpetaArchivosProyecto);

  return {
    raizProyecto,
    biblioteca,
    archivos,
    indice: path.join(biblioteca, BIBLIOTECA_CONFIG.archivoIndiceProyecto)
  };
}

export function asegurarEstructuraBibliotecaProyecto(proyecto = {}) {
  const rutas = obtenerRutasBibliotecaProyecto(proyecto);
  asegurarCarpeta(rutas.biblioteca);
  asegurarCarpeta(rutas.archivos);
  return rutas;
}

export function obtenerCarpetaDestinoRecursoProyecto(proyecto = {}, { categoria = 'otro' } = {}) {
  const rutas = asegurarEstructuraBibliotecaProyecto(proyecto);
  return path.join(rutas.archivos, normalizarCategoriaBiblioteca(categoria));
}

export function crearNombreArchivoBiblioteca({ id, nombreArchivo }) {
  const extension = path.extname(nombreArchivo || '').toLowerCase();
  const base = normalizarId(path.basename(nombreArchivo || id || 'recurso', extension));
  return `${normalizarId(id || base)}-${base}${extension || '.bin'}`;
}

export function crearRutaWebBiblioteca(rutaAbsoluta) {
  return crearRutaRelativaParaWeb(rutaAbsoluta);
}

export function existeRutaArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).isFile());
  } catch (_error) {
    return false;
  }
}
