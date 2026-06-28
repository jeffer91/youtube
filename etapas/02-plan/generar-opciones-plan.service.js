/*
  Bloque 5 - Dos opciones de Plan y eleccion automatica
  Funcion: generar opcion Gemini y opcion local, evaluarlas y elegir la mejor.
*/

import { generarDosOpcionesIAPlan } from '../../ia/ia.conexion.js';
import { seleccionarMejorPlan } from './seleccionar-mejor-plan.service.js';

function crearOpcionesSeguras(opciones = {}) {
  const usarIAReal = Boolean(opciones.usarIARealOpcionesPlan || opciones.activarIARealOpcionesPlan || opciones.usarIARealPlan);
  if (usarIAReal) return opciones;
  return {
    ...opciones,
    usarGemini: false,
    usarOllama: false,
    usarLmstudio: false,
    usarGpt4all: false
  };
}

export async function generarOpcionesPlan({ proyectoId = '', contextoPlan = {}, planPorPartes = {}, opciones = {} } = {}) {
  const opcionesIA = await generarDosOpcionesIAPlan({
    contextoPlan,
    opciones: crearOpcionesSeguras(opciones)
  });
  const comparacion = seleccionarMejorPlan({
    opciones: opcionesIA.opciones || [],
    contextoPlan,
    planPorPartes
  });

  return {
    ok: true,
    tipo: 'opciones-plan-edicion',
    proyectoId,
    modo: opciones.usarIARealOpcionesPlan || opciones.activarIARealOpcionesPlan ? 'ia-real-o-local' : 'seguro-sin-bloqueo',
    opciones: opcionesIA.opciones || [],
    diagnostico: opcionesIA.diagnostico || [],
    comparacion,
    seleccionAutomatica: {
      activa: true,
      ok: Boolean(comparacion.mejorOpcion),
      mejorId: comparacion.resumen.mejorId,
      proveedor: comparacion.resumen.proveedor,
      puntaje: comparacion.resumen.puntaje,
      criterio: comparacion.resumen.criterio
    },
    mejorOpcion: comparacion.opcionSeleccionada || null,
    resumen: {
      totalOpciones: opcionesIA.opciones?.length || 0,
      mejorId: comparacion.resumen.mejorId,
      proveedor: comparacion.resumen.proveedor,
      puntaje: comparacion.resumen.puntaje,
      modo: opciones.usarIARealOpcionesPlan || opciones.activarIARealOpcionesPlan ? 'ia-real-o-local' : 'fallback-estructurado',
      partesValidadas: comparacion.resumen.partesValidadas
    },
    creadoEn: new Date().toISOString()
  };
}

export default generarOpcionesPlan;
