/*
  Nombre completo: procesamiento-checklist-api.js
  Ruta: /app/procesamiento-checklist-api.js

  Función:
  - Preparar las opciones del checklist para enviarlas al backend.
  - Agregar opcionesProcesamiento al FormData del video.
  - Resolver si se debe abrir la pantalla resultado-comparativa.html.
  - Guardar datos temporales para volver a procesar el mismo video.
*/

import {
  aplicarReglasDependencias,
  debeAbrirComparativaSegunOpciones,
  validarOpcionesChecklist
} from './procesamiento-checklist-reglas.js';

const CLAVE_STORAGE_ULTIMO_PROCESAMIENTO = 'autovideojeff_ultimo_procesamiento';

function valorSeguroTexto(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

function buscarPrimeraRutaValida(...valores) {
  for (const valor of valores) {
    const limpio = valorSeguroTexto(valor);
    if (limpio) return limpio;
  }

  return '';
}

function obtenerAnidado(objeto, ruta) {
  if (!objeto || !ruta) return '';

  return ruta.split('.').reduce((actual, clave) => {
    if (!actual || typeof actual !== 'object') return '';
    return actual[clave];
  }, objeto);
}

export function serializarOpcionesProcesamiento(opcionesEntrada = {}) {
  const validacion = validarOpcionesChecklist(opcionesEntrada);

  return JSON.stringify({
    version: '1.0.0',
    ok: validacion.ok,
    opciones: validacion.opciones,
    avisos: validacion.avisos,
    errores: validacion.errores
  });
}

export function agregarOpcionesProcesamientoAFormData(formData, opcionesEntrada = {}) {
  if (!(formData instanceof FormData)) {
    throw new Error('No se pudo preparar el formulario de procesamiento.');
  }

  const validacion = validarOpcionesChecklist(opcionesEntrada);

  if (!validacion.ok) {
    throw new Error(validacion.errores[0] || 'Debes seleccionar al menos una función.');
  }

  formData.set('opcionesProcesamiento', JSON.stringify(validacion.opciones));
  formData.set('procesamientoChecklist', serializarOpcionesProcesamiento(validacion.opciones));

  return formData;
}

export function prepararPayloadOpcionesProcesamiento(opcionesEntrada = {}) {
  const resultado = aplicarReglasDependencias(opcionesEntrada);

  return {
    opcionesProcesamiento: resultado.opciones,
    avisosProcesamiento: resultado.avisos,
    abrirComparativa: debeAbrirComparativaSegunOpciones(resultado.opciones)
  };
}

export function resolverUrlVideoOriginal(respuesta = {}) {
  return buscarPrimeraRutaValida(
    respuesta.videoOriginalUrl,
    respuesta.originalUrl,
    respuesta.urlOriginal,
    respuesta.entradaUrl,
    respuesta.entrada?.url,
    respuesta.entrada?.urlPublica,
    respuesta.entrada?.archivo?.url,
    respuesta.entrada?.archivo?.urlPublica,
    respuesta.archivoOriginal?.url,
    respuesta.archivoOriginal?.urlPublica,
    respuesta.proyecto?.videoOriginalUrl,
    respuesta.proyecto?.originalUrl,
    obtenerAnidado(respuesta, 'datos.videoOriginalUrl'),
    obtenerAnidado(respuesta, 'datos.originalUrl')
  );
}

export function resolverUrlVideoEditado(respuesta = {}) {
  return buscarPrimeraRutaValida(
    respuesta.videoEditadoUrl,
    respuesta.editadoUrl,
    respuesta.exportadoUrl,
    respuesta.urlEditado,
    respuesta.urlExportado,
    respuesta.descargaUrl,
    respuesta.resultado?.url,
    respuesta.resultado?.urlPublica,
    respuesta.resultado?.video?.url,
    respuesta.resultado?.video?.urlPublica,
    respuesta.resultado?.archivo?.url,
    respuesta.resultado?.archivo?.urlPublica,
    respuesta.salida?.url,
    respuesta.salida?.urlPublica,
    respuesta.salida?.exportado?.url,
    respuesta.salida?.exportado?.urlPublica,
    respuesta.exportacion?.url,
    respuesta.exportacion?.urlPublica,
    obtenerAnidado(respuesta, 'datos.videoEditadoUrl'),
    obtenerAnidado(respuesta, 'datos.exportadoUrl')
  );
}

export function construirUrlComparativa({ originalUrl, editadoUrl, jobId = '', opciones = {} } = {}) {
  const original = valorSeguroTexto(originalUrl);
  const editado = valorSeguroTexto(editadoUrl);

  if (!original || !editado) return '';

  const params = new URLSearchParams();
  params.set('original', original);
  params.set('editado', editado);

  if (jobId) params.set('jobId', jobId);

  try {
    params.set('opciones', JSON.stringify(opciones || {}));
  } catch {
    params.set('opciones', '{}');
  }

  return `/resultado-comparativa.html?${params.toString()}`;
}

export function construirUrlComparativaDesdeRespuesta(respuesta = {}, opcionesEntrada = {}) {
  const { opciones } = aplicarReglasDependencias(opcionesEntrada);

  if (!debeAbrirComparativaSegunOpciones(opciones)) return '';

  const originalUrl = resolverUrlVideoOriginal(respuesta);
  const editadoUrl = resolverUrlVideoEditado(respuesta);
  const jobId = respuesta.jobId || respuesta.idProceso || respuesta.procesoId || '';

  return construirUrlComparativa({ originalUrl, editadoUrl, jobId, opciones });
}

export function guardarUltimoProcesamientoParaReprocesar(datos = {}) {
  try {
    const payload = { guardadoEn: new Date().toISOString(), ...datos };
    sessionStorage.setItem(CLAVE_STORAGE_ULTIMO_PROCESAMIENTO, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function leerUltimoProcesamientoParaReprocesar() {
  try {
    const crudo = sessionStorage.getItem(CLAVE_STORAGE_ULTIMO_PROCESAMIENTO);
    if (!crudo) return null;
    return JSON.parse(crudo);
  } catch {
    return null;
  }
}

export function limpiarUltimoProcesamientoParaReprocesar() {
  try {
    sessionStorage.removeItem(CLAVE_STORAGE_ULTIMO_PROCESAMIENTO);
    return true;
  } catch {
    return false;
  }
}

export function abrirComparativaDesdeRespuesta(respuesta = {}, opcionesEntrada = {}) {
  const url = construirUrlComparativaDesdeRespuesta(respuesta, opcionesEntrada);

  if (!url) return false;

  guardarUltimoProcesamientoParaReprocesar({
    respuesta,
    opcionesProcesamiento: aplicarReglasDependencias(opcionesEntrada).opciones,
    comparativaUrl: url
  });

  window.location.href = url;
  return true;
}

export default {
  serializarOpcionesProcesamiento,
  agregarOpcionesProcesamientoAFormData,
  prepararPayloadOpcionesProcesamiento,
  resolverUrlVideoOriginal,
  resolverUrlVideoEditado,
  construirUrlComparativa,
  construirUrlComparativaDesdeRespuesta,
  guardarUltimoProcesamientoParaReprocesar,
  leerUltimoProcesamientoParaReprocesar,
  limpiarUltimoProcesamientoParaReprocesar,
  abrirComparativaDesdeRespuesta
};
