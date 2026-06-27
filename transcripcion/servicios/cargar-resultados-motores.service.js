import fs from 'fs';
import path from 'path';
import { leerJsonSiExiste } from '../../comun/archivos.js';
import {
  ARCHIVOS_TRANSCRIPCION_MULTIMOTOR,
  CARPETAS_TRANSCRIPCION_MULTIMOTOR,
  crearNombreSeguroMotor,
  normalizarIdMotorTranscripcion
} from '../modelos/transcripcion-normalizada.modelo.js';
import { obtenerConfigMultimotorTranscripcion } from '../motores/motores-transcripcion.config.js';

function obtenerCarpetaProyecto(entradaOProyecto) {
  const carpeta = entradaOProyecto?.rutas?.carpetaProyecto || entradaOProyecto?.carpetaProyecto || entradaOProyecto;
  if (!carpeta || typeof carpeta !== 'string') throw new Error('No se puede cargar transcripción multimotor porque falta carpetaProyecto.');
  return carpeta;
}

export function obtenerCarpetaTranscripcionesProyecto(entradaOProyecto) {
  return path.join(obtenerCarpetaProyecto(entradaOProyecto), CARPETAS_TRANSCRIPCION_MULTIMOTOR.RAIZ);
}

export function obtenerRutaResultadoMotorTranscripcion(entradaOProyecto, motor) {
  return path.join(
    obtenerCarpetaTranscripcionesProyecto(entradaOProyecto),
    CARPETAS_TRANSCRIPCION_MULTIMOTOR.MOTORES,
    crearNombreSeguroMotor(motor),
    ARCHIVOS_TRANSCRIPCION_MULTIMOTOR.TRANSCRIPCION_MOTOR
  );
}

export function obtenerRutaTranscripcionPrincipal(entradaOProyecto) {
  return path.join(
    obtenerCarpetaTranscripcionesProyecto(entradaOProyecto),
    CARPETAS_TRANSCRIPCION_MULTIMOTOR.PRINCIPAL,
    ARCHIVOS_TRANSCRIPCION_MULTIMOTOR.TRANSCRIPCION_PRINCIPAL
  );
}

export function obtenerRutaResumenMotoresTranscripcion(entradaOProyecto) {
  return path.join(obtenerCarpetaTranscripcionesProyecto(entradaOProyecto), ARCHIVOS_TRANSCRIPCION_MULTIMOTOR.RESUMEN_MOTORES);
}

export async function cargarResultadoMotorTranscripcion({ entrada, carpetaProyecto, motor } = {}) {
  const base = entrada || carpetaProyecto;
  const motorId = normalizarIdMotorTranscripcion(motor);
  const ruta = obtenerRutaResultadoMotorTranscripcion(base, motorId);
  const resultado = await leerJsonSiExiste(ruta, null);
  return {
    ok: Boolean(resultado),
    motor: motorId,
    ruta,
    existe: Boolean(resultado),
    resultado
  };
}

export async function cargarTranscripcionPrincipal({ entrada, carpetaProyecto } = {}) {
  const base = entrada || carpetaProyecto;
  const ruta = obtenerRutaTranscripcionPrincipal(base);
  const principal = await leerJsonSiExiste(ruta, null);
  return {
    ok: Boolean(principal),
    ruta,
    existe: Boolean(principal),
    principal
  };
}

export async function cargarResumenMotoresTranscripcion({ entrada, carpetaProyecto } = {}) {
  const base = entrada || carpetaProyecto;
  const ruta = obtenerRutaResumenMotoresTranscripcion(base);
  const resumen = await leerJsonSiExiste(ruta, null);
  return {
    ok: Boolean(resumen),
    ruta,
    existe: Boolean(resumen),
    resumen
  };
}

function listarMotoresGuardados(carpetaTranscripciones) {
  const carpetaMotores = path.join(carpetaTranscripciones, CARPETAS_TRANSCRIPCION_MULTIMOTOR.MOTORES);
  try {
    return fs.readdirSync(carpetaMotores, { withFileTypes: true })
      .filter((item) => item.isDirectory())
      .map((item) => normalizarIdMotorTranscripcion(item.name));
  } catch (_error) {
    return [];
  }
}

export async function cargarResultadosMotoresTranscripcion({ entrada, carpetaProyecto, opciones = {} } = {}) {
  const base = entrada || carpetaProyecto;
  const carpeta = obtenerCarpetaTranscripcionesProyecto(base);
  const config = obtenerConfigMultimotorTranscripcion(opciones);
  const resumen = await cargarResumenMotoresTranscripcion({ entrada, carpetaProyecto });
  const principal = await cargarTranscripcionPrincipal({ entrada, carpetaProyecto });
  const motoresDesdeResumen = Array.isArray(resumen.resumen?.resultados) ? resumen.resumen.resultados.map((item) => item.motor) : [];
  const motores = [...new Set([...config.ordenMotores, ...motoresDesdeResumen, ...listarMotoresGuardados(carpeta)])];
  const resultados = [];

  for (const motor of motores) {
    const cargado = await cargarResultadoMotorTranscripcion({ entrada, carpetaProyecto, motor });
    if (cargado.existe) resultados.push(cargado);
  }

  return {
    ok: true,
    version: '1.0.0-multimotor',
    carpeta,
    principal,
    resumen,
    resultados,
    total: resultados.length,
    motoresDisponibles: motores,
    cargadoEn: new Date().toISOString()
  };
}

export default cargarResultadosMotoresTranscripcion;
