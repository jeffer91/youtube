export function crearResultadoController() {
  return {
    nombre: 'resultado',
    formatos: ['9:16', '16:9', '1:1'],
    obtenerEstado() {
      return { pantalla: 'resultado', listo: true, formatos: this.formatos };
    }
  };
}
