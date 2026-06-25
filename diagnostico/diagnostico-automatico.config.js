export const DIAGNOSTICO_AUTOMATICO_CONFIG = Object.freeze({
  version: '1.4.0',
  bloquearSiFfmpegFalla: true,
  bloquearSiCarpetasFallan: true,
  bloquearSiModulosCriticosFallan: true,
  guardarReporte: true,
  nombreReporte: 'diagnostico-automatico.json',
  modulosCriticos: [
    'motor/flujo-principal.js',
    'motor/flujo-plan-revision.js',
    'motor/renderizar-plan-aprobado.js',
    'perfiles/perfiles.conexion.js',
    'inteligencia/inteligencia.conexion.js',
    'broll/broll.conexion.js',
    'plan-edicion/plan-edicion.conexion.js',
    'revision/revision.conexion.js',
    'editar/edicion-dinamica/edicion-dinamica.conexion.js',
    'editar/edicion-dinamica/visual/visual.conexion.js',
    'editar/edicion-dinamica/sonidos/sonidos.conexion.js',
    'salida/exportar-simple/exportar.service.js'
  ]
});

export function obtenerConfigDiagnosticoAutomatico(opciones = {}) {
  return {
    ...DIAGNOSTICO_AUTOMATICO_CONFIG,
    bloquearSiFfmpegFalla: opciones.bloquearSiFfmpegFalla ?? DIAGNOSTICO_AUTOMATICO_CONFIG.bloquearSiFfmpegFalla,
    bloquearSiCarpetasFallan: opciones.bloquearSiCarpetasFallan ?? DIAGNOSTICO_AUTOMATICO_CONFIG.bloquearSiCarpetasFallan,
    bloquearSiModulosCriticosFallan: opciones.bloquearSiModulosCriticosFallan ?? DIAGNOSTICO_AUTOMATICO_CONFIG.bloquearSiModulosCriticosFallan,
    guardarReporte: opciones.guardarReporte ?? DIAGNOSTICO_AUTOMATICO_CONFIG.guardarReporte
  };
}

export default obtenerConfigDiagnosticoAutomatico;
