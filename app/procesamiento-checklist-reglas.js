/*
  Nombre completo: procesamiento-checklist-reglas.js
  Ruta: /app/procesamiento-checklist-reglas.js

  Función:
  - Aplicar reglas simples de dependencia entre opciones.
  - Desactivar automáticamente funciones hijas cuando se apaga una función principal.
  - Validar que el usuario seleccione al menos una opción antes de procesar.
*/

import {
  obtenerClavesChecklistProcesamiento,
  obtenerEtiquetaOpcionProcesamiento,
  obtenerOpcionesChecklistPorDefecto
} from './procesamiento-checklist-config.js';

export const REGLAS_DEPENDENCIAS_PROCESAMIENTO = Object.freeze([
  {
    principal: 'transcripcion',
    dependientes: ['subtitulos', 'textosFlotantes'],
    mensaje: 'Al desmarcar Transcribir video, también se desactivaron subtítulos y textos flotantes.'
  },
  {
    principal: 'cortes',
    dependientes: ['zooms', 'barraProgreso', 'etiquetasVisuales', 'sonidos'],
    mensaje: 'Al desmarcar Cortes automáticos, también se desactivaron zooms, barra, etiquetas y sonidos.'
  }
]);

export function normalizarBooleano(valor, respaldo = true) {
  if (valor === true || valor === 'true' || valor === 1 || valor === '1') return true;
  if (valor === false || valor === 'false' || valor === 0 || valor === '0') return false;
  return respaldo;
}

export function normalizarOpcionesChecklist(opciones = {}) {
  const defecto = obtenerOpcionesChecklistPorDefecto();
  const normalizadas = {};

  obtenerClavesChecklistProcesamiento().forEach((clave) => {
    normalizadas[clave] = normalizarBooleano(opciones[clave], defecto[clave]);
  });

  return normalizadas;
}

export function contarOpcionesActivas(opciones = {}) {
  return obtenerClavesChecklistProcesamiento().reduce((total, clave) => {
    return total + (opciones[clave] === true ? 1 : 0);
  }, 0);
}

export function tieneAlMenosUnaOpcionActiva(opciones = {}) {
  return contarOpcionesActivas(opciones) > 0;
}

export function aplicarReglasDependencias(opcionesEntrada = {}) {
  const opciones = normalizarOpcionesChecklist(opcionesEntrada);
  const avisos = [];
  const cambios = [];

  REGLAS_DEPENDENCIAS_PROCESAMIENTO.forEach((regla) => {
    if (opciones[regla.principal] !== false) return;

    let huboCambio = false;

    regla.dependientes.forEach((claveDependiente) => {
      if (opciones[claveDependiente] === true) {
        opciones[claveDependiente] = false;
        huboCambio = true;

        cambios.push({
          principal: regla.principal,
          dependiente: claveDependiente,
          principalEtiqueta: obtenerEtiquetaOpcionProcesamiento(regla.principal),
          dependienteEtiqueta: obtenerEtiquetaOpcionProcesamiento(claveDependiente)
        });
      }
    });

    if (huboCambio) avisos.push(regla.mensaje);
  });

  return { opciones, avisos, cambios };
}

export function validarOpcionesChecklist(opcionesEntrada = {}) {
  const resultadoReglas = aplicarReglasDependencias(opcionesEntrada);
  const opciones = resultadoReglas.opciones;
  const totalActivas = contarOpcionesActivas(opciones);

  if (totalActivas <= 0) {
    return {
      ok: false,
      opciones,
      avisos: resultadoReglas.avisos,
      errores: ['Debes seleccionar al menos una función para procesar.']
    };
  }

  return { ok: true, opciones, avisos: resultadoReglas.avisos, errores: [] };
}

export function debeAbrirComparativaSegunOpciones(opcionesEntrada = {}) {
  const { opciones } = aplicarReglasDependencias(opcionesEntrada);
  return opciones.exportacion === true;
}

export function obtenerTextoResumenOpciones(opcionesEntrada = {}) {
  const { opciones } = aplicarReglasDependencias(opcionesEntrada);
  const activas = [];
  const omitidas = [];

  obtenerClavesChecklistProcesamiento().forEach((clave) => {
    const etiqueta = obtenerEtiquetaOpcionProcesamiento(clave);

    if (opciones[clave] === true) activas.push(etiqueta);
    else omitidas.push(etiqueta);
  });

  return {
    activas,
    omitidas,
    texto: `Activas: ${activas.length}. Omitidas: ${omitidas.length}.`
  };
}

export default {
  REGLAS_DEPENDENCIAS_PROCESAMIENTO,
  normalizarBooleano,
  normalizarOpcionesChecklist,
  contarOpcionesActivas,
  tieneAlMenosUnaOpcionActiva,
  aplicarReglasDependencias,
  validarOpcionesChecklist,
  debeAbrirComparativaSegunOpciones,
  obtenerTextoResumenOpciones
};
