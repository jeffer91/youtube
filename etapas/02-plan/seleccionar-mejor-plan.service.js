/*
  Bloque 5 - Seleccion automatica del mejor Plan
  Funcion: elegir la opcion con mayor puntaje y preparar resumen para UI/Produccion.
*/

import { evaluarOpcionesPlan } from './evaluar-opciones-plan.service.js';
import { crearResultadoComparacion } from './comparar-plan.modelo.js';

function arr(valor) { return Array.isArray(valor) ? valor : []; }

export function seleccionarMejorPlan({ opciones = [], contextoPlan = {}, planPorPartes = {} } = {}) {
  const evaluaciones = evaluarOpcionesPlan(opciones, contextoPlan);
  const mejorEvaluacion = evaluaciones[0] || null;
  const mejorOpcion = mejorEvaluacion ? arr(opciones).find((opcion) => (opcion.id || opcion.proveedor) === mejorEvaluacion.id) || opciones[0] : null;
  const resultado = crearResultadoComparacion({ opciones, evaluaciones, mejorOpcion: mejorEvaluacion ? {
    id: mejorEvaluacion.id,
    proveedor: mejorEvaluacion.proveedor,
    familia: mejorEvaluacion.familia,
    puntaje: mejorEvaluacion.puntaje,
    timelineItems: mejorEvaluacion.timelineItems,
    recursosReferenciados: mejorEvaluacion.recursosReferenciados,
    compatibleProduccion: mejorEvaluacion.compatibleProduccion
  } : null });

  return {
    ...resultado,
    opcionSeleccionada: mejorOpcion || null,
    resumen: {
      totalOpciones: arr(opciones).length,
      mejorId: mejorEvaluacion?.id || null,
      proveedor: mejorEvaluacion?.proveedor || null,
      puntaje: mejorEvaluacion?.puntaje || 0,
      partesValidadas: planPorPartes.resumen?.validadas || planPorPartes.progreso?.validadas || 0,
      criterio: 'mayor puntaje tecnico'
    }
  };
}

export default seleccionarMejorPlan;
