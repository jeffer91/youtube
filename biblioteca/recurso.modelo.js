/*
  Modulo: biblioteca
  Funcion: modelo normalizado para recursos permanentes y temporales.
*/

import path from 'path';
import {
  BIBLIOTECA_CONFIG,
  ALCANCES_BIBLIOTECA,
  ESTADOS_TECNICOS_RECURSO,
  FORMATOS_RECURSO_BIBLIOTECA,
  obtenerTiposBiblioteca,
  extensionPermitidaBiblioteca
} from './biblioteca.config.js';
import { obtenerCategoriaBiblioteca, normalizarCategoriaBiblioteca } from './categorias.config.js';
import { normalizarListaEstilosVideo } from './estilos-video.config.js';

export function crearIdRecurso(prefijo = 'recurso') {
  return `${limpiarNombreRecurso(prefijo)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function limpiarNombreRecurso(nombre = '') {
  return String(nombre || 'recurso')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'recurso';
}

function limpiarTexto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').trim();
  return limpio || respaldo;
}

function normalizarLista(valor = []) {
  if (Array.isArray(valor)) return valor.map((item) => limpiarTexto(item)).filter(Boolean);
  if (typeof valor === 'string' && valor.trim()) return valor.split(',').map((item) => limpiarTexto(item)).filter(Boolean);
  return [];
}

function normalizarAlcance(valor = ALCANCES_BIBLIOTECA.GENERAL) {
  const limpio = limpiarNombreRecurso(valor || ALCANCES_BIBLIOTECA.GENERAL);
  return Object.values(ALCANCES_BIBLIOTECA).includes(limpio) ? limpio : ALCANCES_BIBLIOTECA.GENERAL;
}

function normalizarEstadoTecnico(valor = ESTADOS_TECNICOS_RECURSO.PENDIENTE) {
  const limpio = limpiarNombreRecurso(valor || ESTADOS_TECNICOS_RECURSO.PENDIENTE);
  return Object.values(ESTADOS_TECNICOS_RECURSO).includes(limpio) ? limpio : BIBLIOTECA_CONFIG.estadoTecnicoPorDefecto;
}

export function detectarTipoArchivoBiblioteca({ nombreArchivo = '', mime = '', tipo = '' } = {}) {
  const tipoLimpio = limpiarNombreRecurso(tipo || '');
  if (obtenerTiposBiblioteca().includes(tipoLimpio)) return tipoLimpio;

  const mimeLimpio = String(mime || '').toLowerCase();
  if (mimeLimpio.startsWith('video/')) return BIBLIOTECA_CONFIG.tipos.VIDEO || 'video';
  if (mimeLimpio.startsWith('image/')) return BIBLIOTECA_CONFIG.tipos.IMAGEN || 'imagen';
  if (mimeLimpio.startsWith('audio/')) return BIBLIOTECA_CONFIG.tipos.AUDIO || 'audio';

  const extension = path.extname(nombreArchivo || '').toLowerCase();
  if (BIBLIOTECA_CONFIG.extensionesPermitidas.video.includes(extension)) return 'video';
  if (BIBLIOTECA_CONFIG.extensionesPermitidas.imagen.includes(extension)) return 'imagen';
  if (BIBLIOTECA_CONFIG.extensionesPermitidas.audio.includes(extension)) return 'audio';
  return 'video';
}

export function detectarFormatoInicialRecurso({ tipo = '', formato = '', orientacion = '', ancho = null, alto = null } = {}) {
  const formatoLimpio = limpiarNombreRecurso(formato || '');
  if (Object.values(FORMATOS_RECURSO_BIBLIOTECA).includes(formatoLimpio)) return formatoLimpio;
  if (tipo === 'audio') return FORMATOS_RECURSO_BIBLIOTECA.AUDIO;

  const o = limpiarNombreRecurso(orientacion || '');
  if (['horizontal', 'landscape', 'youtube'].includes(o)) return FORMATOS_RECURSO_BIBLIOTECA.HORIZONTAL;
  if (['vertical', 'portrait', 'tiktok', 'reels', 'shorts'].includes(o)) return FORMATOS_RECURSO_BIBLIOTECA.VERTICAL;
  if (['cuadrado', 'square'].includes(o)) return FORMATOS_RECURSO_BIBLIOTECA.CUADRADO;

  const w = Number(ancho);
  const h = Number(alto);
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
    const ratio = w / h;
    if (ratio > 1.25) return FORMATOS_RECURSO_BIBLIOTECA.HORIZONTAL;
    if (ratio < 0.8) return FORMATOS_RECURSO_BIBLIOTECA.VERTICAL;
    return FORMATOS_RECURSO_BIBLIOTECA.CUADRADO;
  }

  return tipo === 'imagen' ? FORMATOS_RECURSO_BIBLIOTECA.IMAGEN : FORMATOS_RECURSO_BIBLIOTECA.DESCONOCIDO;
}

function normalizarArchivo(datos = {}, tipo = 'video') {
  const nombreOriginal = limpiarTexto(datos.nombreOriginal || datos.originalname || datos.nombreArchivo || datos.archivo?.nombreOriginal || datos.archivo?.originalname || 'recurso');
  const extension = path.extname(nombreOriginal || datos.ruta || datos.url || '').toLowerCase();
  return {
    nombreOriginal,
    nombreGuardado: limpiarTexto(datos.nombreGuardado || datos.archivo?.nombreGuardado || datos.nombreArchivo || nombreOriginal),
    extension,
    mime: limpiarTexto(datos.mime || datos.mimetype || datos.archivo?.mime || ''),
    tipo,
    pesoBytes: Number(datos.pesoBytes || datos.size || datos.archivo?.pesoBytes || 0) || 0,
    hashSha256: limpiarTexto(datos.hashSha256 || datos.archivo?.hashSha256 || ''),
    rutaAbsoluta: limpiarTexto(datos.rutaAbsoluta || datos.ruta || datos.archivo?.rutaAbsoluta || ''),
    rutaRelativa: limpiarTexto(datos.rutaRelativa || datos.archivo?.rutaRelativa || ''),
    url: limpiarTexto(datos.url || datos.archivo?.url || '')
  };
}

export function crearRecursoModelo(datos = {}) {
  const nombre = limpiarTexto(datos.nombre || datos.titulo || datos.nombreArchivo || datos.originalname || datos.archivo?.nombreOriginal, 'Recurso sin nombre');
  const tipo = detectarTipoArchivoBiblioteca({ nombreArchivo: datos.nombreArchivo || datos.originalname || datos.archivo?.nombreOriginal || nombre, mime: datos.mime || datos.mimetype || datos.archivo?.mime, tipo: datos.tipo });
  const categoria = obtenerCategoriaBiblioteca(datos.categoria || 'otro');
  const estilos = normalizarListaEstilosVideo(datos.estilos || datos.perfiles || datos.perfil || datos.estilo || datos.estiloVideo || ['general']);
  const alcance = normalizarAlcance(datos.alcance || datos.biblioteca || BIBLIOTECA_CONFIG.alcancePorDefecto);
  const archivo = normalizarArchivo(datos, tipo);
  const formatoDetectado = detectarFormatoInicialRecurso({ tipo, formato: datos.formato || datos.tamanoFormato || datos.tamañoFormato, orientacion: datos.orientacion, ancho: datos.ancho, alto: datos.alto });
  const estadoTecnico = normalizarEstadoTecnico(datos.estadoTecnico || datos.estado);

  return {
    id: datos.id || crearIdRecurso(nombre),
    version: BIBLIOTECA_CONFIG.version,
    alcance,
    permanente: alcance === ALCANCES_BIBLIOTECA.GENERAL,
    proyectoId: datos.proyectoId || null,
    nombre,
    nombreArchivo: archivo.nombreGuardado,
    descripcion: datos.descripcion || '',
    tipo,
    categoria: categoria.id,
    categoriaNombre: categoria.nombre,
    categoriaEditable: datos.categoriaEditable || null,
    estilos,
    perfil: datos.perfil || estilos[0] || 'general',
    perfiles: estilos,
    formato: formatoDetectado,
    tamanoFormato: formatoDetectado,
    tamañoFormato: formatoDetectado,
    formatoManual: Boolean(datos.formatoManual || datos.tamanoFormatoManual || datos.tamañoFormatoManual),
    archivo,
    ruta: archivo.rutaAbsoluta || datos.ruta || '',
    rutaRelativa: archivo.rutaRelativa || datos.rutaRelativa || '',
    url: archivo.url || datos.url || '',
    tipoEdicion: datos.tipoEdicion || datos.usoEdicion || datos.usoSugerido || 'recurso_apoyo',
    usoSugerido: datos.usoSugerido || datos.tipoEdicion || 'recurso_apoyo',
    etiquetas: [...new Set(normalizarLista(datos.etiquetas))],
    tema: datos.tema || '',
    fraseRelacionada: datos.fraseRelacionada || '',
    fuente: datos.fuente || 'propio',
    licencia: datos.licencia || BIBLIOTECA_CONFIG.licenciaPorDefecto,
    estadoTecnico,
    estado: estadoTecnico,
    estadoUso: datos.estadoUso || null,
    errores: Array.isArray(datos.errores) ? datos.errores : [],
    advertencias: Array.isArray(datos.advertencias) ? datos.advertencias : [],
    duplicadoDe: datos.duplicadoDe || null,
    reemplazaA: datos.reemplazaA || null,
    uso: datos.uso || { total: 0, proyectos: [] },
    metadata: datos.metadata && typeof datos.metadata === 'object' ? datos.metadata : {},
    creadoEn: datos.creadoEn || new Date().toISOString(),
    actualizadoEn: datos.actualizadoEn || new Date().toISOString()
  };
}

export function validarRecursoModelo(recurso = {}) {
  const errores = [];
  if (!recurso.id) errores.push('El recurso no tiene id.');
  if (!recurso.nombre) errores.push('El recurso no tiene nombre.');
  if (!obtenerTiposBiblioteca().includes(recurso.tipo)) errores.push(`Tipo de recurso no soportado: ${recurso.tipo}`);
  if (!normalizarCategoriaBiblioteca(recurso.categoria)) errores.push(`Categoria no soportada: ${recurso.categoria}`);
  if (!Array.isArray(recurso.estilos) || recurso.estilos.length === 0) errores.push('El recurso debe tener al menos un estilo de video.');

  const extension = recurso.archivo?.extension || path.extname(recurso.nombreArchivo || recurso.ruta || recurso.url || '').toLowerCase();
  if (extension && !extensionPermitidaBiblioteca(extension)) errores.push(`Extension no permitida en biblioteca: ${extension}`);
  if (!recurso.ruta && !recurso.url && !recurso.archivo?.rutaAbsoluta && !recurso.archivo?.rutaRelativa) errores.push('El recurso debe tener archivo local o url.');

  return { ok: errores.length === 0, errores, recurso };
}
