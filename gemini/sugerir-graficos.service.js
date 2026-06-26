/*
  Modulo: gemini
  Funcion: preparar sugerencias de graficos y tablas cuando el contenido lo amerite.
*/

import { obtenerConfigGemini } from './gemini.config.js';
import { generarGraficosVisuales } from '../textos/generar-graficos.service.js';
import { generarTablaVisual } from '../textos/generar-tablas-visuales.service.js';

export function prepararSugerenciaGraficos({ analisis = {}, perfil = {}, opciones = {} } = {}) {
  const config = obtenerConfigGemini(opciones);

  return {
    ok: true,
    tarea: config.tareas.sugerirGraficos,
    modelo: config.modelo,
    payload: {
      perfil: perfil.id || 'general',
      momentosImportantes: analisis.momentosImportantes || [],
      instruccionesPerfil: perfil.instruccionesGemini || '',
      salidaEsperada: {
        graficos: 'solo si ayudan a explicar un dato o comparacion',
        tablas: 'solo si organizan informacion mejor que un texto',
        inicioFin: true,
        motivo: true,
        revisarEnProduccion: true
      }
    },
    instrucciones: [
      'No inventar cifras si el texto no las contiene.',
      'Si no hay datos claros, devolver lista vacia.',
      'Para educacion e institucional priorizar claridad.',
      'Para futbol, cine, anime e historia usar graficos solo si aportan al ritmo.'
    ],
    creadoEn: new Date().toISOString()
  };
}

export function crearGraficosFallback({ datos = [], tabla = null, perfil = 'general' } = {}) {
  const graficos = Array.isArray(datos) && datos.length > 0
    ? generarGraficosVisuales({ datos, titulo: 'Datos clave', perfil }).graficos
    : [];
  const tablas = tabla ? [generarTablaVisual({ ...tabla, perfil })] : [];

  return {
    ok: true,
    fallback: true,
    perfil,
    graficos,
    tablas,
    total: graficos.length + tablas.length,
    creadoEn: new Date().toISOString()
  };
}
