/*
  Modulo: biblioteca-proyecto
  Funcion: guardar y analizar recursos temporales dentro de un proyecto sin copiar recursos generales.
*/

import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { BIBLIOTECA_PROYECTO_CONFIG } from './biblioteca-proyecto.config.js';
import { crearRecursoModelo, validarRecursoModelo } from '../biblioteca/biblioteca.conexion.js';
import { analizarArchivoBiblioteca, fusionarAnalisisConRecurso } from '../biblioteca/analizar-recurso.service.js';
import {
  obtenerRutasBibliotecaProyecto,
  asegurarEstructuraBibliotecaProyecto,
  obtenerCarpetaDestinoRecursoProyecto,
  crearNombreArchivoBiblioteca,
  crearRutaWebBiblioteca,
  existeRutaArchivo
} from '../biblioteca/rutas-biblioteca.service.js';

function rutaIndiceProyecto(proyecto = {}) {
  return obtenerRutasBibliotecaProyecto(proyecto).indice;
}

function obtenerRutaOrigen(datos = {}) {
  return datos.rutaOrigen || datos.rutaTemporal || datos.path || datos.archivo?.path || datos.archivo?.rutaTemporal || datos.archivo?.rutaAbsoluta || datos.ruta || '';
}

function obtenerNombreOriginal(datos = {}) {
  return datos.nombreOriginal || datos.originalname || datos.archivo?.originalname || datos.archivo?.nombreOriginal || datos.nombreArchivo || path.basename(obtenerRutaOrigen(datos) || 'recurso');
}

async function calcularHashArchivo(rutaArchivo) {
  const buffer = await fs.readFile(rutaArchivo);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function leerIndiceProyecto(proyecto) {
  const rutas = asegurarEstructuraBibliotecaProyecto(proyecto);
  try {
    return JSON.parse(await fs.readFile(rutas.indice, 'utf-8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        version: BIBLIOTECA_PROYECTO_CONFIG.version,
        alcance: BIBLIOTECA_PROYECTO_CONFIG.alcance,
        proyectoId: proyecto.id || proyecto.proyectoId || null,
        recursos: []
      };
    }
    throw error;
  }
}

async function copiarArchivoProyecto({ proyecto, datos, recurso }) {
  const rutaOrigen = obtenerRutaOrigen(datos);
  if (!rutaOrigen || !existeRutaArchivo(rutaOrigen)) {
    return {
      copiado: false,
      hashSha256: recurso.archivo?.hashSha256 || '',
      rutaAbsoluta: recurso.ruta || recurso.archivo?.rutaAbsoluta || '',
      rutaRelativa: recurso.rutaRelativa || recurso.archivo?.rutaRelativa || ''
    };
  }

  const hashSha256 = await calcularHashArchivo(rutaOrigen);
  const carpetaDestino = obtenerCarpetaDestinoRecursoProyecto(proyecto, { categoria: recurso.categoria });
  await fs.mkdir(carpetaDestino, { recursive: true });
  const nombreArchivo = crearNombreArchivoBiblioteca({ id: recurso.id, nombreArchivo: obtenerNombreOriginal(datos) });
  const rutaDestino = path.join(carpetaDestino, nombreArchivo);
  await fs.copyFile(rutaOrigen, rutaDestino);

  return {
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
  return null;
}

async function analizarRecursoTemporal(recurso) {
  const rutaArchivo = recurso.archivo?.rutaAbsoluta || recurso.ruta;
  if (!rutaArchivo) return recurso;
  const analisis = await analizarArchivoBiblioteca({ rutaArchivo, recurso, tipo: recurso.tipo, generarMiniatura: true });
  return crearRecursoModelo(fusionarAnalisisConRecurso(recurso, analisis));
}

export async function guardarRecursoProyecto(proyecto = {}, recursoDatos = {}, opciones = {}) {
  const proyectoId = proyecto.id || proyecto.proyectoId || recursoDatos.proyectoId || null;
  const recursoInicial = crearRecursoModelo({
    ...recursoDatos,
    alcance: BIBLIOTECA_PROYECTO_CONFIG.alcance,
    proyectoId,
    permanente: false,
    estadoUso: recursoDatos.estadoUso || BIBLIOTECA_PROYECTO_CONFIG.estadosUso.sugerido
  });

  const archivoGuardado = await copiarArchivoProyecto({ proyecto, datos: recursoDatos, recurso: recursoInicial });
  const recursoGuardado = crearRecursoModelo({
    ...recursoInicial,
    ruta: archivoGuardado.rutaAbsoluta || recursoInicial.ruta,
    rutaRelativa: archivoGuardado.rutaRelativa || recursoInicial.rutaRelativa,
    nombreArchivo: archivoGuardado.nombreArchivo || recursoInicial.nombreArchivo,
    archivo: {
      ...(recursoInicial.archivo || {}),
      nombreGuardado: archivoGuardado.nombreArchivo || recursoInicial.nombreArchivo,
      hashSha256: archivoGuardado.hashSha256 || recursoInicial.archivo?.hashSha256 || '',
      rutaAbsoluta: archivoGuardado.rutaAbsoluta || recursoInicial.archivo?.rutaAbsoluta || recursoInicial.ruta || '',
      rutaRelativa: archivoGuardado.rutaRelativa || recursoInicial.archivo?.rutaRelativa || recursoInicial.rutaRelativa || ''
    },
    estadoTecnico: archivoGuardado.rutaAbsoluta || recursoInicial.ruta || recursoInicial.url ? 'pendiente' : recursoInicial.estadoTecnico,
    actualizadoEn: new Date().toISOString()
  });

  const recurso = await analizarRecursoTemporal(recursoGuardado);
  const validacion = validarRecursoModelo(recurso);
  if (!validacion.ok) {
    const error = new Error(validacion.errores.join(' | '));
    error.errores = validacion.errores;
    throw error;
  }

  const indice = await leerIndiceProyecto(proyecto);
  const duplicado = buscarDuplicado(indice.recursos || [], recurso);
  const accionDuplicado = opciones.accionDuplicado || recursoDatos.accionDuplicado || 'preguntar';
  if (duplicado && accionDuplicado === 'preguntar') {
    return {
      ok: false,
      requiereDecisionDuplicado: true,
      mensaje: 'Este recurso temporal parece repetido dentro del proyecto.',
      recursoPropuesto: recurso,
      duplicado
    };
  }

  let recursos = (indice.recursos || []).filter((item) => item.id !== recurso.id);
  if (duplicado && accionDuplicado === 'reemplazar') recursos = recursos.filter((item) => item.id !== duplicado.id);
  recursos.unshift(recurso);

  const ruta = rutaIndiceProyecto(proyecto);
  await fs.mkdir(path.dirname(ruta), { recursive: true });
  await fs.writeFile(ruta, JSON.stringify({
    ...indice,
    version: BIBLIOTECA_PROYECTO_CONFIG.version,
    proyectoId,
    actualizadoEn: new Date().toISOString(),
    total: recursos.length,
    recursos
  }, null, 2), 'utf-8');

  return {
    ok: true,
    recurso,
    analisis: recurso.analisisArchivo || null,
    mensaje: 'Recurso guardado y analizado en biblioteca temporal del proyecto.'
  };
}

export { rutaIndiceProyecto };
