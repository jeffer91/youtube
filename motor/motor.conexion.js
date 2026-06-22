/*
  Nombre completo: motor.conexion.js
  Ruta o ubicación: AutoVideoJeff/motor/motor.conexion.js
  Función:
    - Ser la puerta de entrada entre server.js y el flujo interno.
    - Validar la solicitud mínima del video.
    - Normalizar opciones generales y opciones del módulo de audio.
    - Ejecutar motor/flujo-principal.js.
    - No ocultar errores reales de edición, audio, salida, FFmpeg, rutas o servicios.
  Con qué se conecta:
    - server.js
    - motor/flujo-principal.js
*/

function esCadenaValida(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function convertirBooleano(valor, valorPorDefecto = true) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off'].includes(limpio)) return false;
  }
  return valorPorDefecto;
}

function esErrorDeFlujoPrincipalFaltante(error) {
  const mensaje = String(error?.message || '');

  return (
    error?.code === 'ERR_MODULE_NOT_FOUND' &&
    mensaje.includes('flujo-principal.js')
  );
}

function validarSolicitud(solicitud) {
  if (!solicitud || typeof solicitud !== 'object') {
    throw new Error('La solicitud del motor no es válida.');
  }

  if (!esCadenaValida(solicitud.archivoTemporal)) {
    throw new Error('No se recibió la ruta temporal del video.');
  }

  if (!esCadenaValida(solicitud.nombreOriginal)) {
    throw new Error('No se recibió el nombre original del video.');
  }

  if (solicitud.opciones && typeof solicitud.opciones !== 'object') {
    throw new Error('Las opciones del motor deben ser un objeto.');
  }
}

function normalizarOpcionesMotor(opciones = {}) {
  return {
    plataforma: opciones.plataforma || 'tiktok',
    modo: opciones.modo || 'simple',
    mejorarAudio: convertirBooleano(opciones.mejorarAudio, true),
    modoAudio: opciones.modoAudio || 'limpieza-simple'
  };
}

function crearRespuestaFlujoPendiente(solicitud) {
  const opciones = normalizarOpcionesMotor(solicitud.opciones || {});

  return {
    ok: false,
    estado: 'FLUJO_PRINCIPAL_PENDIENTE',
    mensaje:
      'Base recibida correctamente, pero falta motor/flujo-principal.js para procesar el video.',
    recibido: {
      nombreOriginal: solicitud.nombreOriginal,
      nombreTemporal: solicitud.nombreTemporal || null,
      plataforma: opciones.plataforma,
      modo: opciones.modo,
      mejorarAudio: opciones.mejorarAudio,
      modoAudio: opciones.modoAudio
    },
    pendientes: [
      'motor/flujo-principal.js',
      'entrada/entrada.conexion.js',
      'entender/entender.conexion.js',
      'audio/audio.conexion.js',
      'editar/editar.conexion.js',
      'salida/salida.conexion.js'
    ]
  };
}

export async function procesarVideoDesdeMotor(solicitud) {
  validarSolicitud(solicitud);

  const opciones = normalizarOpcionesMotor(solicitud.opciones || {});

  try {
    const moduloFlujo = await import('./flujo-principal.js');

    if (typeof moduloFlujo.ejecutarFlujoPrincipal !== 'function') {
      throw new Error(
        'El flujo principal existe, pero no exporta ejecutarFlujoPrincipal.'
      );
    }

    return await moduloFlujo.ejecutarFlujoPrincipal({
      archivoTemporal: solicitud.archivoTemporal,
      nombreOriginal: solicitud.nombreOriginal,
      nombreTemporal: solicitud.nombreTemporal || null,
      opciones
    });
  } catch (error) {
    if (esErrorDeFlujoPrincipalFaltante(error)) {
      return crearRespuestaFlujoPendiente({
        ...solicitud,
        opciones
      });
    }

    throw error;
  }
}