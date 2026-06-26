export function crearProduccionController() {
  return {
    nombre: 'produccion',
    acciones: ['aprobar', 'reemplazar', 'marcar', 'aprender'],
    obtenerEstado() {
      return { pantalla: 'produccion', listo: true, acciones: this.acciones };
    }
  };
}
