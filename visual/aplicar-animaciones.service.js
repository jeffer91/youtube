/*
  Modulo: visual
  Funcion: crear animaciones de entrada, salida y movimiento para recursos visuales.
*/

import { obtenerIntensidadVisual } from './visual.config.js';

const ANIMACIONES_POR_INTENSIDAD = Object.freeze({
  limpia: ['fade_suave'],
  clara: ['fade_suave', 'desplazamiento_corto'],
  equilibrada: ['fade_suave', 'pop_suave', 'desplazamiento_corto'],
  dinamica: ['pop', 'barrido', 'pulso'],
  muy_dinamica: ['pop', 'barrido', 'shake_suave', 'pulso'],
  narrativa: ['fade_suave', 'paneo_lento', 'revelado'],
  cinematica: ['fade_suave', 'paneo_lento', 'zoom_lento']
});

export function crearPlanAnimaciones({ elementos = [], perfil = 'general' } = {}) {
  const intensidad = obtenerIntensidadVisual(perfil);
  const animacionesBase = ANIMACIONES_POR_INTENSIDAD[intensidad] || ANIMACIONES_POR_INTENSIDAD.equilibrada;

  const animaciones = elementos.map((elemento, indice) => ({
    id: `animacion-${indice + 1}`,
    elementoId: elemento.id || `elemento-${indice + 1}`,
    tipo: animacionesBase[indice % animacionesBase.length],
    inicio: Number(elemento.inicio ?? indice * 3),
    fin: Number(elemento.fin ?? Number(elemento.inicio ?? indice * 3) + 2.5),
    intensidad,
    suavizado: intensidad === 'limpia' || intensidad === 'clara'
  }));

  return {
    ok: true,
    perfil,
    intensidad,
    total: animaciones.length,
    animaciones,
    creadoEn: new Date().toISOString()
  };
}
