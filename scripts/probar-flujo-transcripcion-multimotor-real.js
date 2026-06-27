import fs from 'fs';
import path from 'path';
import { escribirJson, obtenerRutaRaiz } from '../comun/archivos.js';

function leerArg(nombre, respaldo = '') {
  const prefijo = `--${nombre}=`;
  const encontrado = process.argv.slice(2).find((arg) => arg.startsWith(prefijo));
  return encontrado ? encontrado.slice(prefijo.length).trim() : respaldo;
}

function existeArchivo(rutaArchivo) {
  try {
    return Boolean(rutaArchivo && fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).size > 0);
  } catch (_error) {
    return false;
  }
}

function texto(valor, respaldo = '') {
  const limpio = String(valor || '').trim();
  return limpio || respaldo;
}

function tieneTexto(transcripcion = {}) {
  return Boolean(String(transcripcion.textoCompleto || '').trim());
}

function extraerResultadoEntendimiento(payload = {}) {
  if (payload?.resultado?.resultado) return payload.resultado.resultado;
  if (payload?.resultado) return payload.resultado;
  if (payload?.datos?.resultado) return payload.datos.resultado;
  return payload;
}

function crearListaMotores(resultado = {}) {
  const transcripcionBase = resultado.transcripcion || {};
  const principal = resultado.transcripcionPrincipal || transcripcionBase.transcripcionPrincipal || (tieneTexto(transcripcionBase) ? transcripcionBase : null);
  const lista = [];
  if (principal) {
    lista.push({
      id: 'principal',
      motor: principal.motor || transcripcionBase.motorPrincipal || transcripcionBase.motor || 'principal',
      estado: principal.estado || (tieneTexto(principal) ? 'ok' : 'pendiente'),
      transcripcion: principal,
      textoUtil: tieneTexto(principal)
    });
  }

  const motores = [
    ...(Array.isArray(resultado.transcripcionesPorMotor) ? resultado.transcripcionesPorMotor : []),
    ...(Array.isArray(transcripcionBase.transcripcionesPorMotor) ? transcripcionBase.transcripcionesPorMotor : [])
  ];

  for (const item of motores) {
    const transcripcion = item.transcripcion || item;
    const motor = item.motor || transcripcion.motor;
    if (!motor) continue;
    if (lista.some((actual) => actual.id === `motor:${motor}`)) continue;
    lista.push({
      id: `motor:${motor}`,
      motor,
      estado: item.estado || transcripcion.estado || (tieneTexto(transcripcion) ? 'ok' : 'pendiente'),
      transcripcion,
      textoUtil: tieneTexto(transcripcion),
      mensaje: item.mensaje || transcripcion.mensaje || ''
    });
  }

  return lista;
}

async function api(baseUrl, ruta, opciones = {}) {
  if (typeof fetch !== 'function') {
    throw new Error('Esta prueba necesita Node 18 o superior para usar fetch global.');
  }

  const url = `${baseUrl.replace(/\/$/, '')}${ruta}`;
  const respuesta = await fetch(url, opciones);
  const cuerpo = await respuesta.text();
  let datos = {};
  try {
    datos = cuerpo ? JSON.parse(cuerpo) : {};
  } catch (_error) {
    datos = { ok: false, mensaje: cuerpo };
  }

  if (!respuesta.ok || datos.ok === false) {
    throw new Error(datos.mensaje || `Error HTTP ${respuesta.status} en ${ruta}`);
  }

  return datos;
}

function validarArchivosProyecto({ proyectoId, seleccionEjecutada = false }) {
  const carpetaProyecto = path.join(obtenerRutaRaiz(), 'datos', 'proyectos', proyectoId);
  const esperados = [
    'transcripciones/audio/audio-motores.wav',
    'transcripciones/audio/audio-motores.json',
    'transcripciones/resumen-motores.json',
    'transcripciones/principal/transcripcion-principal.json'
  ];

  if (seleccionEjecutada) esperados.push('transcripciones/principal/seleccion-manual.json');

  return esperados.map((relativa) => {
    const absoluta = path.join(carpetaProyecto, relativa);
    return {
      archivo: relativa,
      ruta: absoluta,
      existe: existeArchivo(absoluta)
    };
  });
}

function elegirMotorParaSeleccion({ listaMotores, motorPreferido = '' }) {
  const motoresConTexto = listaMotores.filter((item) => item.id !== 'principal' && item.motor && item.textoUtil);
  if (!motoresConTexto.length) return null;
  if (motorPreferido) {
    const preferido = motoresConTexto.find((item) => item.motor === motorPreferido);
    if (preferido) return preferido;
  }
  return motoresConTexto[0];
}

async function main() {
  const baseUrl = texto(leerArg('base-url', process.env.AUTOVIDEOJEFF_BASE_URL), 'http://localhost:3000');
  const proyectoId = texto(leerArg('proyecto-id', process.env.AUTOVIDEOJEFF_PROYECTO_ID));
  const motorPreferido = texto(leerArg('motor', process.env.AUTOVIDEOJEFF_MOTOR_PRINCIPAL));
  const sinSeleccion = process.argv.includes('--sin-seleccion');

  if (!proyectoId) {
    throw new Error('Falta proyectoId. Usa --proyecto-id=PROYECTO o define AUTOVIDEOJEFF_PROYECTO_ID.');
  }

  const reporte = {
    ok: false,
    version: '1.0.0-prueba-real-bloque-19-12',
    baseUrl,
    proyectoId,
    pasos: [],
    archivos: [],
    seleccion: null,
    creadoEn: new Date().toISOString()
  };

  console.log(`Probando flujo multimotor real para proyecto: ${proyectoId}`);

  const diagnostico = await api(baseUrl, '/api/autovideo/transcripcion/motores/diagnostico');
  reporte.pasos.push({ paso: 'diagnostico', ok: true, resumen: diagnostico.diagnostico?.resumen || null });
  console.log('OK diagnóstico de motores');

  const instalacion = await api(baseUrl, '/api/autovideo/transcripcion/motores/instalacion');
  reporte.pasos.push({ paso: 'guia-instalacion', ok: true, pasos: instalacion.guia?.pasos?.length || 0 });
  console.log('OK guía de instalación disponible');

  const procesamiento = await api(baseUrl, `/api/proyectos/${encodeURIComponent(proyectoId)}/entendimiento/procesar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origen: 'script-prueba-bloque-19-12' })
  });
  const resultadoProcesado = extraerResultadoEntendimiento(procesamiento);
  reporte.pasos.push({
    paso: 'procesar-entendimiento',
    ok: true,
    motorPrincipal: resultadoProcesado?.resumen?.motorTranscripcionPrincipal || resultadoProcesado?.transcripcionPrincipal?.motor || null,
    tieneTexto: Boolean(resultadoProcesado?.resumen?.tieneTranscripcionReal || resultadoProcesado?.transcripcionPrincipal?.textoCompleto)
  });
  console.log('OK entendimiento procesado');

  const cargado = await api(baseUrl, `/api/proyectos/${encodeURIComponent(proyectoId)}/entendimiento`);
  const resultadoCargado = extraerResultadoEntendimiento(cargado);
  const listaMotores = crearListaMotores(resultadoCargado);
  reporte.pasos.push({
    paso: 'cargar-entendimiento',
    ok: true,
    motores: listaMotores.map((item) => ({ motor: item.motor, estado: item.estado, textoUtil: item.textoUtil }))
  });
  console.log(`OK entendimiento cargado con ${listaMotores.length} opción(es) de transcripción`);

  let seleccionEjecutada = false;
  const motorSeleccionable = elegirMotorParaSeleccion({ listaMotores, motorPreferido });
  if (!sinSeleccion && motorSeleccionable) {
    const seleccion = await api(baseUrl, `/api/proyectos/${encodeURIComponent(proyectoId)}/transcripciones/${encodeURIComponent(motorSeleccionable.motor)}/usar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo: 'prueba-completa-bloque-19-12', usuario: 'script-local' })
    });
    seleccionEjecutada = true;
    reporte.seleccion = seleccion.seleccion || seleccion;
    reporte.pasos.push({ paso: 'seleccionar-principal', ok: true, motor: motorSeleccionable.motor });
    console.log(`OK selección principal: ${motorSeleccionable.motor}`);
  } else {
    reporte.pasos.push({
      paso: 'seleccionar-principal',
      ok: true,
      omitido: true,
      motivo: sinSeleccion ? 'omitido por --sin-seleccion' : 'no hay motor con texto útil distinto a principal'
    });
    console.log('OK selección principal omitida');
  }

  reporte.archivos = validarArchivosProyecto({ proyectoId, seleccionEjecutada });
  const archivosFaltantes = reporte.archivos.filter((item) => !item.existe);
  reporte.ok = archivosFaltantes.length === 0 && reporte.pasos.every((paso) => paso.ok);
  reporte.archivosFaltantes = archivosFaltantes;

  const rutaReporte = path.join(obtenerRutaRaiz(), 'datos', 'proyectos', proyectoId, 'transcripciones', 'prueba-completa-bloque-19-12.json');
  await escribirJson(rutaReporte, reporte);

  if (!reporte.ok) {
    console.error('Prueba incompleta. Archivos faltantes:');
    archivosFaltantes.forEach((item) => console.error(`- ${item.archivo}`));
    console.error(`Reporte: ${rutaReporte}`);
    process.exit(1);
  }

  console.log('\nBloque 19.12 OK: prueba completa con video real superada.');
  console.log(`Reporte: ${rutaReporte}`);
}

main().catch((error) => {
  console.error(`Error en prueba completa: ${error.message}`);
  process.exit(1);
});
