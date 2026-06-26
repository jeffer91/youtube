/*
  Modulo: gemini
  Funcion: preparar sugerencias de estilo de edicion segun perfil, plataforma y contenido.
*/

import { obtenerConfigGemini } from './gemini.config.js';
import { obtenerIntensidadVisual } from '../visual/visual.conexion.js';

export function prepararSugerenciaEstiloEdicion({ perfil = {}, proyecto = {}, plataformas = [], analisis = {}, opciones = {} } = {}) {
  const config = obtenerConfigGemini(opciones);
  const perfilId = perfil.id || proyecto.perfil || 'general';

  return {
    ok: true,
    tarea: config.tareas.sugerirEstilo,
    modelo: config.modelo,
    payload: {
      proyecto: { id: proyecto.id || null, nombre: proyecto.nombre || '' },
      perfil: perfilId,
      nombrePerfil: perfil.nombre || perfilId,
      plataformas,
      intensidadBase: obtenerIntensidadVisual(perfilId),
      momentosImportantes: analisis.momentosImportantes || [],
      preferenciasJeff: {
        dinamico: true,
        musicaBaja: true,
        textosImpacto: true,
        subtitulosConContorno: true,
        noTaparSujeto: true,
        revisarEnProduccion: true
      },
      salidaEsperada: {
        ritmo: true,
        zooms: true,
        fondos: true,
        animaciones: true,
        efectos: true,
        subtitulos: true,
        recursos: true
      }
    },
    instrucciones: [
      'Proponer estilo, no renderizar directamente.',
      'Separar recomendaciones por plataforma.',
      'El resultado debe pasar por Produccion antes de exportar.',
      'Mantener coherencia con el perfil seleccionado.'
    ],
    creadoEn: new Date().toISOString()
  };
}

export function crearEstiloEdicionFallback({ perfil = 'general', plataformas = [] } = {}) {
  const intensidad = obtenerIntensidadVisual(perfil);
  return {
    ok: true,
    fallback: true,
    perfil,
    intensidad,
    plataformas,
    estilo: {
      ritmo: intensidad,
      zooms: intensidad === 'limpia' ? 'suaves' : 'dinamicos',
      fondos: ['muy_dinamica', 'dinamica', 'narrativa', 'cinematica'].includes(intensidad),
      animaciones: intensidad === 'limpia' ? 'minimas' : 'moderadas',
      efectos: intensidad === 'limpia' ? 'limpios' : 'visuales',
      subtitulos: 'con_contorno_y_zona_segura'
    },
    creadoEn: new Date().toISOString()
  };
}
