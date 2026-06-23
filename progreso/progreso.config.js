export const ETAPAS_PROGRESO = Object.freeze({
  inicio: { porcentaje: 0, titulo: 'Preparando video', archivo: 'server.js' },
  diagnostico: { porcentaje: 5, titulo: 'Revisando sistema', archivo: 'diagnostico/diagnostico-automatico.service.js' },
  entrada: { porcentaje: 10, titulo: 'Copiando video', archivo: 'entrada/entrada.conexion.js' },
  entender: { porcentaje: 18, titulo: 'Analizando video', archivo: 'entender/entender.conexion.js' },
  audio: { porcentaje: 28, titulo: 'Mejorando audio', archivo: 'audio/audio.conexion.js' },
  transcripcion: { porcentaje: 40, titulo: 'Preparando subtítulos y textos', archivo: 'transcripcion/transcripcion.conexion.js' },
  'edicion-dinamica': { porcentaje: 56, titulo: 'Cortando silencios', archivo: 'editar/edicion-dinamica/edicion-dinamica.conexion.js' },
  editar: { porcentaje: 74, titulo: 'Agregando visuales y sonidos', archivo: 'editar/editar.conexion.js' },
  salida: { porcentaje: 90, titulo: 'Exportando video final', archivo: 'salida/salida.conexion.js' },
  finalizado: { porcentaje: 100, titulo: 'Video listo', archivo: 'server.js' },
  error: { porcentaje: 100, titulo: 'Fallo de edición', archivo: 'server.js' }
});

export function obtenerConfigEtapa(etapa = 'inicio') {
  return ETAPAS_PROGRESO[etapa] || { porcentaje: 0, titulo: etapa || 'Procesando', archivo: null };
}

export default ETAPAS_PROGRESO;
