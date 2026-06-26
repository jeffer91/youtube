/*
  Modulo: biblioteca-proyecto
  Funcion: registrar que un recurso fue usado en el video/proyecto.
*/

import { BIBLIOTECA_PROYECTO_CONFIG } from './biblioteca-proyecto.config.js';
import { guardarRecursoProyecto } from './guardar-recurso-proyecto.service.js';

export async function registrarRecursoUsado(proyecto = {}, recurso = {}, uso = {}, opciones = {}) {
  const recursoUsado = {
    ...recurso,
    estadoUso: uso.estadoUso || BIBLIOTECA_PROYECTO_CONFIG.estadosUso.usado,
    uso: {
      ...(recurso.uso || {}),
      total: Number(recurso.uso?.total || 0) + 1,
      ultimoUso: {
        proyectoId: proyecto.id,
        inicio: uso.inicio ?? null,
        fin: uso.fin ?? null,
        motivo: uso.motivo || '',
        aprobado: uso.aprobado === true,
        fecha: new Date().toISOString()
      }
    }
  };

  return guardarRecursoProyecto(proyecto, recursoUsado, opciones);
}
