/*
  Modulo: audio
  Funcion: construir un plan de limpieza de audio sin romper el flujo existente.
*/

import { detectarRuidoInicial } from './detectar-ruido-inicial.service.js';
import { crearPlanSilenciarSegmento } from './silenciar-segmento.service.js';
import { crearPlanCorteInicioRuidoso } from './cortar-inicio-ruidoso.service.js';

export function crearPlanLimpiezaAudio(datos = {}, opciones = {}) {
  const ruido = detectarRuidoInicial(datos, opciones);
  const acciones = [];

  if (ruido.detectado) {
    acciones.push({ tipo: 'limpiar_ruido', zona: { inicio: ruido.inicio, fin: ruido.fin }, prioridad: 'alta' });
    acciones.push(crearPlanSilenciarSegmento({ inicio: ruido.inicio, fin: ruido.fin, motivo: 'ruido_inicial' }));

    if (opciones.permitirCorteInicio === true || ruido.nivel === 'alto') {
      acciones.push(crearPlanCorteInicioRuidoso(ruido, opciones));
    }
  }

  return {
    ok: true,
    etapa: 'audio_plan',
    ruidoInicial: ruido,
    acciones,
    filtrosFfmpeg: acciones.filter((accion) => accion.filtroFfmpeg).map((accion) => accion.filtroFfmpeg),
    mensaje: acciones.length > 0
      ? 'Plan de limpieza de audio creado con acciones para ruido inicial.'
      : 'No se requieren acciones especiales de limpieza inicial.',
    creadoEn: new Date().toISOString()
  };
}

export function resumirPlanLimpiezaAudio(plan = {}) {
  return {
    tieneRuidoInicial: Boolean(plan.ruidoInicial?.detectado),
    totalAcciones: Array.isArray(plan.acciones) ? plan.acciones.length : 0,
    filtros: plan.filtrosFfmpeg || [],
    mensaje: plan.mensaje || ''
  };
}
