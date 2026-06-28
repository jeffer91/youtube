/*
  Bloque 5 - Modelo de comparacion de opciones de Plan
  Funcion: definir criterios para elegir automaticamente el mejor plan.
*/

export const CRITERIOS_COMPARACION_PLAN = Object.freeze([
  { id: 'jsonValido', nombre: 'JSON tecnico valido', peso: 30 },
  { id: 'timelineCompleto', nombre: 'Timeline completo', peso: 25 },
  { id: 'usaBiblioteca', nombre: 'Uso correcto de biblioteca', peso: 15 },
  { id: 'coherenciaContexto', nombre: 'Coherencia con contexto', peso: 15 },
  { id: 'proveedorReal', nombre: 'Respuesta de proveedor real', peso: 10 },
  { id: 'compatibleProduccion', nombre: 'Compatible con produccion', peso: 5 }
]);

export function crearResultadoComparacion({ opciones = [], evaluaciones = [], mejorOpcion = null } = {}) {
  return {
    ok: Boolean(mejorOpcion),
    tipo: 'comparacion-opciones-plan',
    criterios: CRITERIOS_COMPARACION_PLAN,
    totalOpciones: opciones.length,
    evaluaciones,
    mejorOpcion,
    creadoEn: new Date().toISOString()
  };
}
