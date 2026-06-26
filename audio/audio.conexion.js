/*
  Nombre completo: audio.conexion.js
  Ruta o ubicación: AutoVideoJeff/audio/audio.conexion.js
  Función o funciones:
    - Ser la puerta de comunicación del módulo audio/.
    - Decidir si se debe mejorar el audio del video.
    - Conectar el motor principal con audio/limpieza-simple/limpieza-audio.service.js.
    - Devolver un objeto estándar para que salida/ use audio original o audio limpio.
    - Si audio falla, no debe detener toda la edición: se usa el audio original.
  Con qué se conecta:
    - motor/flujo-principal.js
    - audio/limpieza-simple/limpieza-audio.service.js
    - salida/salida.conexion.js
*/

import { limpiarAudioSimple } from './limpieza-simple/limpieza-audio.service.js';

function convertirBooleano(valor, valorPorDefecto = false) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off'].includes(limpio)) return false;
  }
  return valorPorDefecto;
}

function normalizarOpcionesAudio(opciones = {}) {
  const mejorarAudio = convertirBooleano(opciones.mejorarAudio, true);

  return {
    mejorarAudio,
    modoAudio: opciones.modoAudio || 'limpieza-simple'
  };
}

function validarBaseAudio({ entrada, entendimiento }) {
  if (!entrada || typeof entrada !== 'object') {
    throw new Error('No se puede procesar audio porque falta la entrada.');
  }

  if (!entrada.video?.rutaOriginal) {
    throw new Error('No se puede procesar audio porque falta la ruta del video original.');
  }

  if (!entendimiento || typeof entendimiento !== 'object') {
    throw new Error('No se puede procesar audio porque falta el entendimiento del video.');
  }

  if (entendimiento.ok !== true) {
    throw new Error('No se puede procesar audio porque el análisis del video no terminó correctamente.');
  }
}

function crearResultadoAudioOmitido(motivo, opcionesAudio, error = null) {
  return {
    ok: true,
    etapa: 'audio',
    tipo: opcionesAudio?.modoAudio || 'audio-original',
    omitido: true,
    usarAudioMejorado: false,
    mensaje: motivo,
    rutaAudioMejorado: null,
    nombreAudioMejorado: null,
    opcionesAudio,
    errorControlado: error
      ? {
          modulo: 'audio',
          mensaje: error.message || String(error),
          archivo: 'audio/audio.conexion.js'
        }
      : null,
    creadoEn: new Date().toISOString()
  };
}

export async function mejorarAudioVideo({ entrada, entendimiento, opciones = {} }) {
  const opcionesAudio = normalizarOpcionesAudio(opciones);

  try {
    validarBaseAudio({ entrada, entendimiento });

    if (!opcionesAudio.mejorarAudio) {
      return crearResultadoAudioOmitido(
        'Mejora de audio desactivada por opciones del usuario.',
        opcionesAudio
      );
    }

    if (opcionesAudio.modoAudio !== 'limpieza-simple') {
      return crearResultadoAudioOmitido(
        `Modo de audio no soportado todavía: ${opcionesAudio.modoAudio}. Se usará el audio original.`,
        opcionesAudio
      );
    }

    return await limpiarAudioSimple({
      entrada,
      entendimiento,
      opciones: {
        ...opciones,
        ...opcionesAudio
      }
    });
  } catch (error) {
    console.warn('[audio] Audio omitido por error controlado:', error.message);
    return crearResultadoAudioOmitido(
      'No se pudo mejorar el audio. La edición continuará con el audio original.',
      opcionesAudio,
      error
    );
  }
}
