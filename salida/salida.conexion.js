/*
  Nombre completo: salida.conexion.js
  Ruta o ubicación: AutoVideoJeff/salida/salida.conexion.js
  Función o funciones:
    - Ser la puerta de comunicación para todo lo relacionado con la salida del video.
    - Recibir el plan de edición.
    - Llamar al exportador simple.
    - Devolver la ruta pública del video final para la pantalla principal.
  Con qué se conecta:
    - motor/flujo-principal.js
    - salida/exportar-simple/exportar.service.js
    - editar/tiktok-simple/tiktok.service.js
*/

import { exportarVideoSimple } from './exportar-simple/exportar.service.js';

export async function prepararSalida({ entrada, entendimiento, edicion, opciones }) {
  if (!edicion?.render?.filtroVideo) {
    throw new Error('No se puede exportar porque falta el plan de render.');
  }

  return await exportarVideoSimple({
    entrada,
    entendimiento,
    edicion,
    opciones
  });
}
