export function crearBibliotecaController() {
  return {
    nombre: 'biblioteca',
    secciones: ['general', 'proyecto', 'externos', 'categorias'],
    obtenerEstado() {
      return { pantalla: 'biblioteca', listo: true, secciones: this.secciones };
    }
  };
}
