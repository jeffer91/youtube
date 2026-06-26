export function crearProcesadoController() {
  return {
    nombre: 'procesado',
    etapas: ['audio', 'transcripcion', 'gemini', 'recursos', 'subtitulos', 'visual', 'exportacion'],
    obtenerEstado() {
      return { pantalla: 'procesado', listo: true, etapas: this.etapas };
    }
  };
}
