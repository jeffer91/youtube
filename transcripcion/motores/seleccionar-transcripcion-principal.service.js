import path from 'path';
import { escribirJson, obtenerRutaRaiz } from '../../comun/archivos.js';
import {
  cargarResultadoMotorTranscripcion,
  cargarResultadosMotoresTranscripcion,
  obtenerRutaTranscripcionPrincipal
} from '../servicios/cargar-resultados-motores.service.js';
import {
  guardarResumenMotoresTranscripcion,
  guardarTranscripcionPrincipal
} from '../servicios/guardar-resultados-motores.service.js';
import { normalizarIdMotorTranscripcion, transcripcionTieneTextoUtil } from '../modelos/transcripcion-normalizada.modelo.js';

function texto(valor, respaldo = '') {
  const limpio = String(valor || '').trim();
  return limpio || respaldo;
}

function obtenerCarpetaProyecto(proyectoId) {
  if (!proyectoId) throw new Error('Falta proyectoId para seleccionar transcripción principal.');
  return path.join(obtenerRutaRaiz(), 'datos', 'proyectos', proyectoId);
}

function crearEntradaProyecto(proyectoId) {
  const carpetaProyecto = obtenerCarpetaProyecto(proyectoId);
  return {
    proyecto: { id: proyectoId },
    rutas: { carpetaProyecto }
  };
}

function normalizarResultadoSeleccionable(resultado = {}) {
  if (!resultado) return null;
  if (resultado.transcripcion) return resultado;
  return {
    ok: Boolean(resultado.ok || resultado.textoCompleto),
    motor: resultado.motor,
    estado: resultado.estado || (resultado.textoCompleto ? 'ok' : 'pendiente'),
    transcripcion: resultado,
    resumen: resultado.resumen || null,
    mensaje: resultado.mensaje || resultado.observacion || ''
  };
}

async function guardarRegistroSeleccion({ entrada, motor, resultado, motivo, usuario = null }) {
  const rutaPrincipal = obtenerRutaTranscripcionPrincipal(entrada);
  const rutaRegistro = path.join(path.dirname(rutaPrincipal), 'seleccion-manual.json');
  const payload = {
    ok: true,
    version: '1.0.0-seleccion-manual',
    proyectoId: entrada.proyecto?.id || null,
    motor,
    motivo,
    usuario,
    resumen: resultado.resumen || resultado.transcripcion?.resumen || null,
    textoUtil: transcripcionTieneTextoUtil(resultado.transcripcion || resultado),
    seleccionadoEn: new Date().toISOString()
  };
  await escribirJson(rutaRegistro, payload);
  return { ruta: rutaRegistro, registro: payload };
}

export async function seleccionarTranscripcionPrincipalProyecto({ proyectoId, motor, motivo = 'seleccion-manual', usuario = null, permitirVacia = false } = {}) {
  const motorId = normalizarIdMotorTranscripcion(motor);
  const entrada = crearEntradaProyecto(proyectoId);
  const cargado = await cargarResultadoMotorTranscripcion({ entrada, motor: motorId });

  if (!cargado.existe || !cargado.resultado) {
    throw new Error(`No existe transcripción guardada para el motor ${motorId}. Procesa Entendimiento primero.`);
  }

  const resultado = normalizarResultadoSeleccionable(cargado.resultado);
  if (!resultado?.transcripcion) {
    throw new Error(`La transcripción del motor ${motorId} no tiene estructura válida.`);
  }

  if (!permitirVacia && !transcripcionTieneTextoUtil(resultado.transcripcion)) {
    throw new Error(`La transcripción del motor ${motorId} no tiene texto útil para usar como principal.`);
  }

  const lote = await cargarResultadosMotoresTranscripcion({ entrada });
  const resultados = Array.isArray(lote.resultados) ? lote.resultados.map((item) => item.resultado).filter(Boolean) : [resultado];
  const guardadoPrincipal = await guardarTranscripcionPrincipal({
    entrada,
    resultadoPrincipal: resultado,
    motivo: texto(motivo, 'seleccion-manual')
  });
  const resumen = await guardarResumenMotoresTranscripcion({
    entrada,
    resultados,
    principal: resultado,
    opciones: { motorPrincipalTranscripcion: motorId }
  });
  const registro = await guardarRegistroSeleccion({ entrada, motor: motorId, resultado, motivo, usuario });

  return {
    ok: true,
    proyectoId,
    motor: motorId,
    principal: guardadoPrincipal?.principal || null,
    transcripcionPrincipal: resultado.transcripcion,
    resumen: resumen?.resumen || null,
    registro,
    rutas: {
      transcripcionPrincipal: guardadoPrincipal?.ruta || null,
      resumenMotores: resumen?.ruta || null,
      seleccionManual: registro?.ruta || null
    },
    mensaje: `Transcripción ${motorId} seleccionada como principal.`
  };
}

export default seleccionarTranscripcionPrincipalProyecto;
