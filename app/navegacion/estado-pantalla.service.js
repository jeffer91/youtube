/*
  Modulo UI: navegacion
  Funcion: recordar la pantalla activa sin recargar todo desde cero.
*/

const CLAVE_ESTADO = 'autovideojeff:pantalla-activa';

export function guardarPantallaActiva(pantallaId) {
  try {
    window.localStorage.setItem(CLAVE_ESTADO, pantallaId || 'inicio');
  } catch (_error) {
    // No bloquear la app si localStorage no esta disponible.
  }
}

export function obtenerPantallaActiva(defecto = 'inicio') {
  try {
    return window.localStorage.getItem(CLAVE_ESTADO) || defecto;
  } catch (_error) {
    return defecto;
  }
}

export function limpiarPantallaActiva() {
  try {
    window.localStorage.removeItem(CLAVE_ESTADO);
  } catch (_error) {
    // Sin accion.
  }
}
