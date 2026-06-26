/*
  Modulo: gemini
  Funcion: preparar sugerencias de imagenes, fondos y clips de apoyo.
*/

import { obtenerConfigGemini } from './gemini.config.js';
import { prepararBusquedaImagenes } from '../recursos-externos/buscar-imagenes.service.js';
import { prepararBusquedaClips } from '../recursos-externos/buscar-videos.service.js';

export function prepararSugerenciaRecursos({ analisis = {}, perfil = {}, biblioteca = [], opciones = {} } = {}) {
  const config = obtenerConfigGemini(opciones);
  const momentos = analisis.momentosImportantes || [];

  return {
    ok: true,
    tarea: config.tareas.sugerirRecursos,
    modelo: config.modelo,
    payload: {
      perfil: perfil.id || 'general',
      instruccionesPerfil: perfil.instruccionesGemini || '',
      momentos: momentos.map((momento) => ({
        id: momento.id,
        inicio: momento.inicio,
        fin: momento.fin,
        texto: momento.texto,
        prioridad: momento.prioridad
      })),
      bibliotecaDisponible: biblioteca.slice(0, 30).map((recurso) => ({
        id: recurso.id,
        nombre: recurso.nombre,
        tipo: recurso.tipo,
        categoria: recurso.categoria,
        etiquetas: recurso.etiquetas
      })),
      reglas: [
        'Primero usar biblioteca interna.',
        'Si falta recurso, proponer busqueda externa con fuente y licencia.',
        'Cada recurso debe explicar que frase o momento apoya.',
        'Los recursos quedan pendientes para Produccion.'
      ]
    },
    creadoEn: new Date().toISOString()
  };
}

export function crearSugerenciasRecursosFallback({ analisis = {}, perfil = 'general' } = {}) {
  const momentos = analisis.momentosImportantes || [];
  const sugerencias = momentos.slice(0, 8).flatMap((momento) => {
    const contexto = { tema: momento.texto, frase: momento.texto, perfil };
    return [
      { momentoId: momento.id, tipo: 'imagen', estado: 'pendiente', busqueda: prepararBusquedaImagenes(contexto) },
      { momentoId: momento.id, tipo: 'video', estado: 'pendiente', busqueda: prepararBusquedaClips(contexto) }
    ];
  });

  return {
    ok: true,
    fallback: true,
    perfil,
    sugerencias,
    total: sugerencias.length,
    creadoEn: new Date().toISOString()
  };
}
