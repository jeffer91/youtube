/*
  Bloque 18
  Funcion: ejecutar las tareas Gemini del paquete de edicion.
*/

import { ejecutarTareaGeminiReal } from './cliente-gemini.service.js';

const ORDEN_TAREAS = ['analisis', 'recursos', 'textos', 'graficos', 'estilo'];

export async function ejecutarPaqueteGeminiEdicion({ paquete = {}, opciones = {} } = {}) {
  const tareas = paquete.tareas || {};
  const resultados = {};
  const errores = [];

  for (const nombre of ORDEN_TAREAS) {
    if (!tareas[nombre]) continue;
    try {
      resultados[nombre] = await ejecutarTareaGeminiReal(tareas[nombre], opciones);
    } catch (error) {
      errores.push({ tarea: nombre, mensaje: error.message });
      resultados[nombre] = { ok: false, tarea: nombre, mensaje: error.message, creadoEn: new Date().toISOString() };
    }
  }

  const reales = Object.values(resultados).filter((item) => item.real).length;
  const fallback = Object.values(resultados).filter((item) => item.fallback).length;

  return {
    ...paquete,
    ejecutado: true,
    resultados,
    resumen: {
      tareas: Object.keys(resultados).length,
      reales,
      fallback,
      errores: errores.length
    },
    errores,
    estado: errores.length ? 'GEMINI_CON_ERRORES_CONTROLADOS' : reales ? 'GEMINI_REAL_CONECTADO' : 'GEMINI_FALLBACK_LOCAL',
    actualizadoEn: new Date().toISOString()
  };
}
