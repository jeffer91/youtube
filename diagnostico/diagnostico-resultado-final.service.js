/*
  Nombre completo: diagnostico-resultado-final.service.js
  Ruta: /diagnostico/diagnostico-resultado-final.service.js

  Función:
  - Diagnosticar si el resultado final está listo para frontend y comparativa.
*/

import { validarResultadoFinal } from '../motor/validar-resultado-final.js';

export function crearDiagnosticoResultadoFinal({ salida = {}, opciones = {}, videoEditadoUrl = null, reporteImpacto = null } = {}) {
  const validacion = validarResultadoFinal({ salida, opciones, videoEditadoUrl });

  return {
    ok: validacion.ok,
    bloqueante: !validacion.ok,
    tipo: 'diagnostico-resultado-final',
    mensaje: validacion.ok
      ? 'Resultado final validado correctamente.'
      : 'El resultado final no está completo para el frontend.',
    validacionFinal: validacion,
    reporteImpactoDisponible: Boolean(reporteImpacto),
    porcentajeEntrega: validacion.porcentajeEntrega,
    errores: validacion.errores || [],
    advertencias: validacion.advertencias || [],
    creadoEn: new Date().toISOString()
  };
}

export default { crearDiagnosticoResultadoFinal };
