/*
  Nombre completo: resumen-opciones-procesamiento.js
  Ruta: /motor/resumen-opciones-procesamiento.js

  Función:
  - Crear un resumen claro de las funciones procesadas y omitidas.
  - Preparar datos simples para el frontend.
  - Evitar que una función omitida por el usuario se muestre como error.
*/

import {
  obtenerClavesOpcionesProcesamiento,
  obtenerEtiquetaOpcionProcesamiento,
  normalizarOpcionesProcesamiento
} from './opciones-procesamiento.js';

export function crearResumenOpcionesProcesamiento(opcionesEntrada = null) {
  const opciones = normalizarOpcionesProcesamiento(opcionesEntrada);
  const procesadas = [];
  const omitidas = [];

  obtenerClavesOpcionesProcesamiento().forEach((clave) => {
    const item = { clave, etiqueta: obtenerEtiquetaOpcionProcesamiento(clave) };

    if (opciones[clave] === true) procesadas.push(item);
    else omitidas.push(item);
  });

  return {
    opciones,
    total: procesadas.length + omitidas.length,
    totalProcesadas: procesadas.length,
    totalOmitidas: omitidas.length,
    procesadas,
    omitidas,
    texto: crearTextoResumenOpciones({ procesadas, omitidas })
  };
}

export function crearTextoResumenOpciones({ procesadas = [], omitidas = [] } = {}) {
  const partes = [];

  if (procesadas.length > 0) {
    partes.push(`Procesadas: ${procesadas.map((item) => item.etiqueta).join(', ')}.`);
  }

  if (omitidas.length > 0) {
    partes.push(`Omitidas por selección del usuario: ${omitidas.map((item) => item.etiqueta).join(', ')}.`);
  }

  if (!partes.length) return 'No se seleccionaron funciones para procesar.';

  return partes.join(' ');
}

export function crearResumenCompactoOpcionesProcesamiento(opcionesEntrada = null) {
  const resumen = crearResumenOpcionesProcesamiento(opcionesEntrada);

  return {
    totalProcesadas: resumen.totalProcesadas,
    totalOmitidas: resumen.totalOmitidas,
    texto: resumen.texto
  };
}

export function crearMapaEstadoOpcionesProcesamiento(opcionesEntrada = null) {
  const opciones = normalizarOpcionesProcesamiento(opcionesEntrada);
  const mapa = {};

  obtenerClavesOpcionesProcesamiento().forEach((clave) => {
    mapa[clave] = {
      clave,
      etiqueta: obtenerEtiquetaOpcionProcesamiento(clave),
      activo: opciones[clave] === true,
      estado: opciones[clave] === true ? 'procesado' : 'omitido'
    };
  });

  return mapa;
}

export function crearRespuestaOpcionesProcesamiento(opcionesEntrada = null) {
  const resumen = crearResumenOpcionesProcesamiento(opcionesEntrada);
  const mapa = crearMapaEstadoOpcionesProcesamiento(opcionesEntrada);

  return {
    ok: true,
    opcionesProcesamiento: resumen.opciones,
    resumenProcesamiento: {
      total: resumen.total,
      totalProcesadas: resumen.totalProcesadas,
      totalOmitidas: resumen.totalOmitidas,
      texto: resumen.texto
    },
    detalleProcesamiento: {
      procesadas: resumen.procesadas,
      omitidas: resumen.omitidas,
      mapa
    }
  };
}

export function marcarModuloOmitido(nombreModulo, motivo = 'Omitido por selección del usuario.') {
  return { activo: false, omitido: true, modulo: nombreModulo, motivo };
}

export function marcarModuloProcesado(nombreModulo, datos = {}) {
  return { activo: true, omitido: false, modulo: nombreModulo, ...datos };
}

export default {
  crearResumenOpcionesProcesamiento,
  crearTextoResumenOpciones,
  crearResumenCompactoOpcionesProcesamiento,
  crearMapaEstadoOpcionesProcesamiento,
  crearRespuestaOpcionesProcesamiento,
  marcarModuloOmitido,
  marcarModuloProcesado
};
