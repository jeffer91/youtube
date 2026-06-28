/*
  Bloque 6 - Reparador de plan ejecutable
  Funcion: corregir problemas menores del JSON tecnico antes de enviarlo a Produccion.
*/

import { crearAccionPlanEjecutable } from './plan-ejecutable.modelo.js';
import { validarPlanEjecutable } from './validar-plan-ejecutable.service.js';

function arr(valor) { return Array.isArray(valor) ? valor : []; }

export function repararPlanEjecutable(planEjecutable = {}) {
  const timelineBase = arr(planEjecutable.timeline);
  const timeline = timelineBase
    .map(crearAccionPlanEjecutable)
    .sort((a, b) => a.inicio - b.inicio || a.orden - b.orden)
    .map((item, index) => ({
      ...item,
      id: item.id || `accion-${index + 1}`,
      orden: index + 1,
      fin: item.fin <= item.inicio ? Number((item.inicio + 2.5).toFixed(2)) : item.fin,
      accion: item.accion || (index === 0 ? 'gancho_inicial' : 'accion_edicion')
    }));

  const recursos = [...new Set([
    ...arr(planEjecutable.recursos),
    ...timeline.map((item) => item.recursoBiblioteca).filter(Boolean)
  ])];

  const reparado = {
    ...planEjecutable,
    ok: timeline.length > 0,
    tipo: 'plan-ejecutable-produccion',
    timeline,
    recursos,
    salidaProduccion: {
      ...(planEjecutable.salidaProduccion || {}),
      usarTimelineEjecutable: true,
      totalAcciones: timeline.length,
      totalRecursos: recursos.length,
      compatibleConPistas: true
    },
    reparadoEn: new Date().toISOString()
  };

  return {
    plan: reparado,
    validacion: validarPlanEjecutable(reparado)
  };
}

export default repararPlanEjecutable;
