export function crearPerfilesController() {
  return {
    nombre: 'perfiles',
    perfiles: ['11-contra-11', 'jeff-isekai', 'creciaula', 'general', 'institucional', 'el-don-historia', 'jeff-verso'],
    obtenerEstado() {
      return { pantalla: 'perfiles', listo: true, perfiles: this.perfiles };
    }
  };
}
