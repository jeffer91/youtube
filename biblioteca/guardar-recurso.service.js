/*
  Modulo: biblioteca
  Funcion: guardar, analizar o actualizar recursos permanentes en la biblioteca general.
*/

import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { BIBLIOTECA_CONFIG, ALCANCES_BIBLIOTECA } from './biblioteca.config.js';
import { crearRecursoModelo, validarRecursoModelo, limpiarNombreRecurso } from './recurso.modelo.js';
import { analizarArchivoBiblioteca, fusionarAnalisisConRecurso } from './analizar-recurso.service.js';
import { listarRecursosBiblioteca, escribirIndiceBibliotecaGeneral } from './listar-recursos.service.js';
import {
  obtenerCarpetaDestinoRecursoGeneral,
  crearNombreArchivoBiblioteca,
  crearRutaWebBiblioteca,
  existeRutaArchivo
} from './rutas-biblioteca.service.js';

async function calcularHashArchivo(rutaArchivo) {
  const hash = crypto.createHash('sha256');
  const buffer = await fs.readFile(rutaArchivo);
  hash.update(buffer);
  return hash.digest('hex');
}

function obtenerRutaOrigen(datos = {}) {
  return datos.rutaOrigen || datos.rutaTemporal || datos.path || datos.archivo?.path || datos.archivo?.rutaTemporal || datos.archivo?.rutaAbsoluta || datos.ruta || '';
}

function obtenerNombreOriginal(datos = {}) {
  return datos.nombreOriginal || datos.originalname || datos.archivo?.originalname || datos.archivo?.nombreOriginal || datos.nombreArchivo || path.basename(obtenerRutaOrigen(datos) || 'recurso');
}

function normalizarAccionDuplicado(valor = BIBLIOTECA_CONFIG.duplicados.preguntar) {
  const limpio = limpiarNombreRecurso(valor || BIBLIOTECA_CONFIG.duplicados.preguntar);
  return Object.values(BIBLIOTECA_CONFIG.duplicados).includes(limpio) ? limpio : BIBLIOTECA_CONFIG.duplicados.preguntar;
}

async function copiarArchivoBiblioteca({ datos, recurso }) {
  const rutaOrigen = obtenerRutaOrigen(datos);
  if (!rutaOrigen || !existeRutaArchivo(rutaOrigen)) {
    return {
      recurso,
      copiado: false,
      hashSha256: recurso.archivo?.hashSha256 || '',
      rutaAbsoluta: recurso.ruta || recurso.archivo?.rutaAbsoluta || '',
      rutaRelativa: recurso.rutaRelativa || recurso.archivo?.rutaRelativa || ''
    };
  }

  const hashSha256 = await calcularHashArchivo(rutaOrigen);
  const carpetaDestino = obtenerCarpetaDestinoRecursoGeneral({ estilos: recurso.estilos, categoria: recurso.categoria });
  await fs.mkdir(carpetaDestino, { recursive: true });
  const nombreArchivo = crearNombreArchivoBiblioteca({ id: recurso.id, nombreArchivo: obtenerNombreOriginal(datos) });
  const rutaDestino = path.join(carpetaDestino, nombreArchivo);
  await fs.copyFile(rutaOrigen, rutaDestino);

  return {
    recurso,
    copiado: true,
    hashSha256,
    nombreArchivo,
    rutaAbsoluta: rutaDestino,
    rutaRelativa: crearRutaWebBiblioteca(rutaDestino)
  };
}

function buscarDuplicado(recursos = [], recurso = {}) {
  const hash = recurso.archivo?.hashSha256;
  if (hash) {
    const porHash = recursos.find((item) => item.archivo?.hashSha256 === hash && item.id !== recurso.id);
    if (porHash) return porHash;
  }

  const nombre = String(recurso.nombre || '').trim().toLowerCase();
  const categoria = recurso.categoria;
  const estiloPrincipal = recurso.estilos?.[0] || recurso.perfil || 'general';
  return resourcesFind(recursos, recurso, nombre, categoria, estiloPrincipal);
}

function resourcesFind(recursos = [], recurso = {}, nombre = '', categoria = '', estiloPrincipal = 'general') {
  return recursos.find((item) =>
    item.id !== recurso.id &&
    String(item.nombre || '').trim().toLowerCase() === nombre &&
    item.categoria === categoria &&
    (item.estilos || item.perfiles || []).includes(estiloPrincipal)
  ) || null;
}

function fusionarRecursoGuardado(recurso, archivoGuardado = {}) {
  return crearRecursoModelo({
    ...recurso,
    alcance: ALCANCES_BIBLIOTECA.GENERAL,
    ruta: archivoGuardado.rutaAbsoluta || recurso.ruta,
    rutaRelativa: archivoGuardado.rutaRelativa || recurso.rutaRelativa,
    nombreArchivo: archivoGuardado.nombreArchivo || recurso.nombreArchivo,
    archivo: {
      ...(recurso.archivo || {}),
      nombreGuardado: archivoGuardado.nombreArchivo || recurso.nombreArchivo,
      hashSha256: archivoGuardado.hashSha256 || recurso.archivo?.hashSha256 || '',
      rutaAbsoluta: archivoGuardado.rutaAbsoluta || recurso.archivo?.rutaAbsoluta || recurso.ruta || '',
      rutaRelativa: archivoGuardado.rutaRelativa || recurso.archivo?.rutaRelativa || recurso.rutaRelativa || ''
    },
    estadoTecnico: archivoGuardado.rutaAbsoluta || recurso.ruta || recurso.url ? 'pendiente' : recurso.estadoTecnico,
    actualizadoEn: new Date().toISOString()
  });
}

async function analizarRecursoGuardado(recurso) {
  const rutaArchivo = recurso.archivo?.rutaAbsoluta || recurso.ruta;
  if (!rutaArchivo) return recurso;
  const analisis = await analizarArchivoBiblioteca({ rutaArchivo, recurso, tipo: recurso.tipo, generarMiniatura: true });
  return crearRecursoModelo(fusionarAnalisisConRecurso(recurso, analisis));
}

export async function guardarRecursoBiblioteca(datos = {}, opciones = {}) {
  const accionDuplicado = normalizarAccionDuplicado(opciones.accionDuplicado || datos.accionDuplicado);
  const recursoInicial = crearRecursoModelo({ ...datos, alcance: ALCANCES_BIBLIOTECA.GENERAL });
  const archivoGuardado = await copiarArchivoBiblioteca({ datos, recurso: recursoInicial });
  const recursoGuardado = fusionarRecursoGuardado(recursoInicial, archivoGuardado);
  const recurso = await analizarRecursoGuardado(recursoGuardado);
  const validacion = validarRecursoModelo(recurso);
  if (!validacion.ok) {
    const error = new Error(validacion.errores.join(' | '));
    error.errores = validacion.errores;
    throw error;
  }

  const recursos = await listarRecursosBiblioteca();
  const duplicado = buscarDuplicado(recursos, recurso);

  if (duplicado && accionDuplicado === BIBLIOTECA_CONFIG.duplicados.preguntar) {
    return {
      ok: false,
      requiereDecisionDuplicado: true,
      mensaje: 'Este recurso parece repetido. Decide si quieres reemplazarlo o duplicarlo.',
      recursoPropuesto: recurso,
      duplicado
    };
  }

  let actualizados = recursos.filter((item) => item.id !== recurso.id);
  let recursoFinal = recurso;

  if (duplicado && accionDuplicado === BIBLIOTECA_CONFIG.duplicados.reemplazar) {
    actualizados = actualizados.filter((item) => item.id !== duplicado.id);
    recursoFinal = crearRecursoModelo({ ...recurso, id: duplicado.id, reemplazaA: duplicado.id, creadoEn: duplicado.creadoEn });
  }

  if (duplicado && accionDuplicado === BIBLIOTECA_CONFIG.duplicados.duplicar) {
    recursoFinal = crearRecursoModelo({ ...recurso, id: undefined, duplicadoDe: duplicado.id, nombre: `${recurso.nombre} copia` });
  }

  const indice = await escribirIndiceBibliotecaGeneral([recursoFinal, ...actualizados]);
  return {
    ok: true,
    recurso: recursoFinal,
    analisis: recursoFinal.analisisArchivo || null,
    indice: {
      total: indice.total,
      ruta: indice.rutas?.indice || null
    },
    mensaje: 'Recurso guardado y analizado en biblioteca general permanente.'
  };
}

export default guardarRecursoBiblioteca;
