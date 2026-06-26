/*
  Modulo: visual
  Funcion: decidir encuadre automatico del sujeto segun perfil y plataforma.
*/

import { VISUAL_CONFIG, obtenerIntensidadVisual } from './visual.config.js';

function modoPorPerfil(perfil) {
  if (perfil === 'institucional' || perfil === 'creciaula') return VISUAL_CONFIG.modosEncuadre.medio;
  if (perfil === 'jeff-isekai' || perfil === '11-contra-11') return VISUAL_CONFIG.modosEncuadre.pequenoConFondo;
  if (perfil === 'jeff-verso' || perfil === 'el-don-historia') return VISUAL_CONFIG.modosEncuadre.cercano;
  return VISUAL_CONFIG.modosEncuadre.automatico;
}

export function crearPlanEncuadreDinamico({ perfil = 'general', plataforma = {}, sujeto = {}, rostro = {} } = {}) {
  const intensidad = obtenerIntensidadVisual(perfil);
  const modo = modoPorPerfil(perfil);
  const formato = plataforma.formato || '9:16';
  const centro = rostro.centro || sujeto.centro || { x: (plataforma.width || 1080) / 2, y: (plataforma.height || 1920) / 2 };

  let escala = 1;
  if (modo === VISUAL_CONFIG.modosEncuadre.cercano) escala = formato === '9:16' ? 1.18 : 1.08;
  if (modo === VISUAL_CONFIG.modosEncuadre.medio) escala = 1.02;
  if (modo === VISUAL_CONFIG.modosEncuadre.pequenoConFondo) escala = 0.72;

  return {
    ok: true,
    perfil,
    intensidad,
    formato,
    modo,
    centro,
    escala,
    mantenerRostroVisible: true,
    dejarZonaParaTextos: true,
    revisarEnProduccion: modo === VISUAL_CONFIG.modosEncuadre.pequenoConFondo,
    creadoEn: new Date().toISOString()
  };
}
