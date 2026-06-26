/*
  Modulo: biblioteca-proyecto
  Funcion: reemplazar un recurso mal elegido y dejar rastro para aprendizaje.
*/

import { BIBLIOTECA_PROYECTO_CONFIG } from './biblioteca-proyecto.config.js';
import { listarRecursosProyecto } from './listar-recursos-proyecto.service.js';
import { guardarRecursoProyecto } from './guardar-recurso-proyecto.service.js';

export async function reemplazarRecursoProyecto(proyecto = {}, reemplazo = {}, opciones = {}) {
  const recursos = await listarRecursosProyecto(proyecto, opciones);
  const anterior = recursos.find((item) => item.id === reemplazo.recursoAnteriorId);
  if (!anterior) throw new Error('No se encontro el recurso anterior para reemplazar.');

  const anteriorMarcado = {
    ...anterior,
    estadoUso: BIBLIOTECA_PROYECTO_CONFIG.estadosUso.reemplazado,
    reemplazadoPor: reemplazo.nuevoRecurso?.id || null,
    motivoReemplazo: reemplazo.motivo || 'Reemplazo manual en produccion',
    actualizadoEn: new Date().toISOString()
  };

  await guardarRecursoProyecto(proyecto, anteriorMarcado, opciones);
  const nuevo = await guardarRecursoProyecto(proyecto, {
    ...(reemplazo.nuevoRecurso || {}),
    estadoUso: BIBLIOTECA_PROYECTO_CONFIG.estadosUso.aprobado,
    reemplazaA: anterior.id,
    fraseRelacionada: reemplazo.fraseRelacionada || anterior.fraseRelacionada,
    tema: reemplazo.tema || anterior.tema
  }, opciones);

  return { anterior: anteriorMarcado, nuevo, motivo: reemplazo.motivo || '' };
}
