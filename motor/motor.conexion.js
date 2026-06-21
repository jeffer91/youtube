/*
  Nombre completo: motor.conexion.js
  Ruta o ubicación: AutoVideoJeff/motor/motor.conexion.js
  Función o funciones:
    - Ser la puerta de entrada entre el servidor y el flujo interno de la app.
    - Validar que exista una solicitud mínima de procesamiento.
    - Llamar al flujo principal cuando el archivo motor/flujo-principal.js exista.
    - Evitar que la app se rompa mientras se crean los siguientes bloques.
  Con qué se conecta:
    - server.js
    - motor/flujo-principal.js
    - entrada/entrada.conexion.js
    - entender/entender.conexion.js
    - editar/editar.conexion.js
    - salida/salida.conexion.js
*/

function esErrorDeModuloPendiente(error) {
  return (
    error &&
    (error.code === 'ERR_MODULE_NOT_FOUND' ||
      String(error.message || '').includes('flujo-principal.js'))
  );
}

function validarSolicitud(solicitud) {
  if (!solicitud || typeof solicitud !== 'object') {
    throw new Error('La solicitud del motor no es válida.');
  }

  if (!solicitud.archivoTemporal) {
    throw new Error('No se recibió la ruta temporal del video.');
  }

  if (!solicitud.nombreOriginal) {
    throw new Error('No se recibió el nombre original del video.');
  }
}

export async function procesarVideoDesdeMotor(solicitud) {
  validarSolicitud(solicitud);

  try {
    const moduloFlujo = await import('./flujo-principal.js');

    if (typeof moduloFlujo.ejecutarFlujoPrincipal !== 'function') {
      throw new Error('El flujo principal existe, pero no exporta ejecutarFlujoPrincipal.');
    }

    return await moduloFlujo.ejecutarFlujoPrincipal(solicitud);
  } catch (error) {
    if (!esErrorDeModuloPendiente(error)) {
      throw error;
    }

    return {
      ok: false,
      estado: 'BLOQUE_1_LISTO_FLUJO_PENDIENTE',
      mensaje:
        'Base recibida correctamente. Falta crear el flujo principal y los módulos internos para editar el video.',
      recibido: {
        nombreOriginal: solicitud.nombreOriginal,
        nombreTemporal: solicitud.nombreTemporal || null,
        plataforma: solicitud.opciones?.plataforma || 'tiktok',
        modo: solicitud.opciones?.modo || 'simple'
      },
      pendientes: [
        'motor/flujo-principal.js',
        'entrada/entrada.conexion.js',
        'entender/entender.conexion.js',
        'editar/editar.conexion.js',
        'salida/salida.conexion.js'
      ]
    };
  }
}
