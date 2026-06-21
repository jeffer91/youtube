/*
  Nombre completo: entrada.conexion.js
  Ruta o ubicación: AutoVideoJeff/entrada/entrada.conexion.js
  Función o funciones:
    - Ser la puerta de entrada para todo lo relacionado con recibir videos.
    - Conectar el motor principal con la carga simple actual.
    - Devolver una estructura estándar del proyecto creado.
  Con qué se conecta:
    - motor/flujo-principal.js
    - entrada/subir-simple/subir.service.js
    - comun/archivos.js
*/

import { subirVideoSimple } from './subir-simple/subir.service.js';

function validarEntrada(solicitud) {
  if (!solicitud?.archivoTemporal) {
    throw new Error('Entrada inválida: falta el archivo temporal del video.');
  }

  if (!solicitud?.nombreOriginal) {
    throw new Error('Entrada inválida: falta el nombre original del video.');
  }
}

export async function procesarEntrada(solicitud) {
  validarEntrada(solicitud);

  const resultado = await subirVideoSimple({
    archivoTemporal: solicitud.archivoTemporal,
    nombreOriginal: solicitud.nombreOriginal,
    nombreTemporal: solicitud.nombreTemporal,
    opciones: solicitud.opciones || {}
  });

  return {
    ok: true,
    etapa: 'entrada',
    proyecto: resultado.proyecto,
    video: resultado.video,
    rutas: resultado.rutas
  };
}
