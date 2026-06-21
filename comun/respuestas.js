/*
  Nombre completo: respuestas.js
  Ruta o ubicación: AutoVideoJeff/comun/respuestas.js
  Función o funciones:
    - Centralizar formatos de respuesta para la app.
    - Mantener una estructura igual en todos los módulos.
  Con qué se conecta:
    - server.js
    - motor/flujo-principal.js
*/

export function crearOk(mensaje = 'Operación completada.', datos = {}) {
  return {
    ok: true,
    estado: 'OK',
    mensaje,
    ...datos
  };
}

export function crearPendiente(mensaje = 'Proceso pendiente.', pendientes = [], datos = {}) {
  return {
    ok: false,
    estado: 'PENDIENTE',
    mensaje,
    pendientes,
    ...datos
  };
}

export function crearProblema(mensaje = 'No se pudo completar la operación.', detalle = null) {
  return {
    ok: false,
    estado: 'PROBLEMA',
    mensaje,
    detalle
  };
}
