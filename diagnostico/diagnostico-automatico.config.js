export const DIAGNOSTICO_AUTOMATICO_CONFIG = Object.freeze({
  version: '1.1.0',
  bloquearSiFfmpegFalla: true,
  bloquearSiCarpetasFallan: true,
  bloquearSiModulosCriticosFallan: true,
  guardarReporte: true,
  nombreReporte: 'diagnostico-automatico.json',
  modulosCriticos: [
    'server.js',
    'main.js',
    'preload.js',
    'app/index.html',
    'app/app.js',
    'motor/motor.conexion.js',
    'motor/flujo-principal.js',
    'entrada/entrada.conexion.js',
    'entender/entender.conexion.js',
    'audio/audio.conexion.js',
    'transcripcion/transcripcion.conexion.js',
    'editar/editar.conexion.js',
    'editar/edicion-dinamica/edicion-dinamica.conexion.js',
    'editar/edicion-dinamica/visual/visual.conexion.js',
    'editar/edicion-dinamica/sonidos/sonidos.conexion.js',
    'salida/salida.conexion.js',
    'salida/exportar-simple/exportar.service.js',
    'progreso/progreso.conexion.js',
    'progreso/progreso-registro.js'
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
