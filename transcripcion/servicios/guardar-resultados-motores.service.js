import path from 'path';
import { escribirJson } from '../../comun/archivos.js';
import {
  ARCHIVOS_TRANSCRIPCION_MULTIMOTOR,
  CARPETAS_TRANSCRIPCION_MULTIMOTOR,
  crearNombreSeguroMotor,
  crearResultadoMotorTranscripcion,
  elegirMejorResultadoTranscripcion,
  normalizarIdMotorTranscripcion
} from '../modelos/transcripcion-normalizada.modelo.js';
import { obtenerConfigMultimotorTranscripcion } from '../motores/motores-transcripcion.config.js';

function obtenerCarpetaProyecto(entrada) {
  const carpeta = entrada?.rutas?.carpetaProyecto;
  if (!carpeta) throw new Error('No se puede guardar transcripción multimotor porque falta carpetaProyecto.');
  return carpeta;
}

export function obtenerCarpetaTranscripcionesProyecto(entrada) {
  return path.join(obtenerCarpetaProyecto(entrada), CARPETAS_TRANSCRIPCION_MULTIMOTOR.RAIZ);
}

export function obtenerCarpetaMotorTranscripcion(entrada, motor) {
  return path.join(
    obtenerCarpetaTranscripcionesProyecto(entrada),
    CARPETAS_TRANSCRIPCION_MULTIMOTOR.MOTORES,
    crearNombreSeguroMotor(motor)
  );
}

export function obtenerRutaResultadoMotorTranscripcion(entrada, motor) {
  return path.join(obtenerCarpetaMotorTranscripcion(entrada, motor), ARCHIVOS_TRANSCRIPCION_MULTIMOTOR.TRANSCRIPCION_MOTOR);
}

export function obtenerRutaTranscripcionPrincipal(entrada) {
  return path.join(
    obtenerCarpetaTranscripcionesProyecto(entrada),
    CARPETAS_TRANSCRIPCION_MULTIMOTOR.PRINCIPAL,
    ARCHIVOS_TRANSCRIPCION_MULTIMOTOR.TRANSCRIPCION_PRINCIPAL
  );
}

export function obtenerRutaResumenMotoresTranscripcion(entrada) {
  return path.join(obtenerCarpetaTranscripcionesProyecto(entrada), ARCHIVOS_TRANSCRIPCION_MULTIMOTOR.RESUMEN_MOTORES);
}

function normalizarResultadoMotor(resultado = {}) {
  if (resultado.transcripcion) return resultado;
  return crearResultadoMotorTranscripcion({
    motor: resultado.motor,
    transcripcion: resultado,
    estado: resultado.estado,
    mensaje: resultado.mensaje,
    error: resultado.error,
    metadata: resultado.metadata
  });
}

function crearResumenResultadoMotor(resultado = {}) {
  const transcripcion = resultado.transcripcion || {};
  const resumen = resultado.resumen || transcripcion.resumen || {};
  return {
    motor: normalizarIdMotorTranscripcion(resultado.motor || transcripcion.motor),
    ok: Boolean(resultado.ok || transcripcion.ok),
    estado: resultado.estado || transcripcion.estado || 'pendiente',
    textoUtil: Boolean(resumen.textoUtil),
    caracteres: resumen.caracteres || 0,
    palabras: resumen.palabras || 0,
    segmentos: resumen.segmentos || transcripcion.cantidadSegmentos || 0,
    duracionCubierta: resumen.duracionCubierta || null,
    mensaje: resultado.mensaje || transcripcion.mensaje || '',
    error: resultado.error || transcripcion.error || null
  };
}

export async function guardarResultadoMotorTranscripcion({ entrada, resultadoMotor } = {}) {
  if (!resultadoMotor) throw new Error('No se recibió resultadoMotor para guardar.');
  const normalizado = normalizarResultadoMotor(resultadoMotor);
  const ruta = obtenerRutaResultadoMotorTranscripcion(entrada, normalizado.motor);

  await escribirJson(ruta, {
    ...normalizado,
    guardadoEn: new Date().toISOString()
  });

  return {
    ok: true,
    motor: normalizado.motor,
    ruta,
    resultado: normalizado
  };
}

export async function guardarTranscripcionPrincipal({ entrada, resultadoPrincipal, motivo = 'seleccion-automatica' } = {}) {
  if (!resultadoPrincipal) return null;
  const normalizado = normalizarResultadoMotor(resultadoPrincipal);
  const ruta = obtenerRutaTranscripcionPrincipal(entrada);

  const payload = {
    ok: true,
    version: '1.0.0-multimotor',
    motivo,
    motor: normalizado.motor,
    transcripcion: normalizado.transcripcion,
    resumen: normalizado.resumen,
    seleccionadoEn: new Date().toISOString()
  };

  await escribirJson(ruta, payload);
  return { ok: true, ruta, principal: payload };
}

export async function guardarResumenMotoresTranscripcion({ entrada, resultados = [], principal = null, opciones = {} } = {}) {
  const config = obtenerConfigMultimotorTranscripcion(opciones);
  const resumenes = resultados.map((resultado) => crearResumenResultadoMotor(normalizarResultadoMotor(resultado)));
  const ruta = obtenerRutaResumenMotoresTranscripcion(entrada);

  const payload = {
    ok: true,
    version: '1.0.0-multimotor',
    proyectoId: entrada?.proyecto?.id || null,
    totalMotores: resumenes.length,
    motorPrincipal: principal?.motor || null,
    ordenMotores: config.ordenMotores,
    resultados: resumenes,
    actualizadoEn: new Date().toISOString()
  };

  await escribirJson(ruta, payload);
  return { ok: true, ruta, resumen: payload };
}

export async function guardarLoteResultadosTranscripcion({ entrada, resultados = [], principal = null, opciones = {} } = {}) {
  const lista = Array.isArray(resultados) ? resultados.filter(Boolean).map(normalizarResultadoMotor) : [];
  const config = obtenerConfigMultimotorTranscripcion(opciones);
  const guardados = [];

  for (const resultado of lista) {
    guardados.push(await guardarResultadoMotorTranscripcion({ entrada, resultadoMotor: resultado }));
  }

  const principalCalculado = principal || elegirMejorResultadoTranscripcion(lista, config.ordenMotores);
  const guardadoPrincipal = await guardarTranscripcionPrincipal({
    entrada,
    resultadoPrincipal: principalCalculado,
    motivo: principal ? 'seleccion-explicita' : 'seleccion-automatica'
  });
  const resumen = await guardarResumenMotoresTranscripcion({ entrada, resultados: lista, principal: principalCalculado, opciones });

  return {
    ok: true,
    carpeta: obtenerCarpetaTranscripcionesProyecto(entrada),
    guardados,
    principal: guardadoPrincipal,
    resumen,
    total: guardados.length
  };
}

export default guardarLoteResultadosTranscripcion;
