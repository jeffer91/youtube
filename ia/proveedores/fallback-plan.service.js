/*
  Bloque 3 - Proveedor fallback interno para Plan
  Función: garantizar que siempre exista una respuesta mínima ejecutable.
*/

import { crearRespuestaFallbackPlan, normalizarRespuestaPlanIA } from '../normalizar-respuesta-ia.service.js';

export async function ejecutarFallbackPlan(contextoPlan = {}, opciones = {}) {
  const motivo = opciones.motivo || 'Ningún proveedor IA gratuito/local respondió.';
  const respuesta = crearRespuestaFallbackPlan(contextoPlan, motivo);
  return normalizarRespuestaPlanIA({
    proveedor: 'fallback',
    modelo: 'auto-video-jeff-fallback',
    respuesta,
    contexto: contextoPlan,
    real: false,
    fallback: true,
    motivo
  });
}

export default ejecutarFallbackPlan;
