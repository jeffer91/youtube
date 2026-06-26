export function crearNuevoProyectoController() {
  return {
    nombre: 'nuevo-proyecto',
    obtenerEstado() {
      return { pantalla: 'nuevo-proyecto', listo: true };
    }
  };
}
