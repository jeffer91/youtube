export function crearDiagnosticoController() {
  return {
    nombre: 'diagnostico',
    modulos: ['proyectos', 'perfiles', 'audio', 'subtitulos', 'visual', 'biblioteca', 'gemini', 'produccion'],
    obtenerEstado() {
      return { pantalla: 'diagnostico', listo: true, modulos: this.modulos };
    }
  };
}
