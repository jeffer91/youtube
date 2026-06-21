/*
  Nombre completo: editar.conexion.js
  Ruta o ubicación: AutoVideoJeff/editar/editar.conexion.js
  Función o funciones:
    - Ser la puerta de comunicación para todo lo relacionado con la edición del video.
    - Tomar la entrada y el entendimiento del video.
    - Llamar al editor simple de TikTok.
    - Devolver un plan de edición estándar para que salida/ pueda exportar.
  Con qué se conecta:
    - motor/flujo-principal.js
    - editar/tiktok-simple/tiktok.service.js
    - biblioteca/tiktok-simple.json
*/

import { crearEdicionTikTokSimple } from './tiktok-simple/tiktok.service.js';

export async function editarVideo({ entrada, entendimiento, opciones }) {
  if (!entrada?.video?.rutaOriginal) {
    throw new Error('No se puede editar porque falta el video original.');
  }

  const plataforma = opciones?.plataforma || entrada.proyecto?.plataforma || 'tiktok';

  if (plataforma !== 'tiktok') {
    throw new Error(`La primera versión solo admite TikTok. Plataforma indicada: ${plataforma}`);
  }

  return await crearEdicionTikTokSimple({
    entrada,
    entendimiento,
    opciones
  });
}
