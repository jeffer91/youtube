/*
  Nombre completo: audio.conexion.js
  Ruta o ubicación: AutoVideoJeff/audio/audio.conexion.js

  Función:
  - Ser la puerta de comunicación del módulo audio/.
  - Decidir si se debe mejorar el audio del video.
  - Devolver resultado estándar con métrica de ejecución e impacto estimado.
*/

import { limpiarAudioSimple } from './limpieza-simple/limpieza-audio.service.js';
import { calcularImpactoAudio } from '../motor/metricas/audio-impacto.service.js';

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
  return { mejorarAudio, modoAudio: opciones.modoAudio || 'limpieza-simple' };
}

function validarBaseAudio({ entrada, entendimiento }) {
  if (!entrada || typeof entrada !== 'object') throw new Error('No se puede procesar audio porque falta la entrada.');
  if (!entrada.video?.rutaOriginal) throw new Error('No se puede procesar audio porque falta la ruta del video original.');
  if (!entendimiento || typeof entendimiento !== 'object') throw new Error('No se puede procesar audio porque falta el entendimiento del video.');
  if (entendimiento.ok !== true) throw new Error('No se puede procesar audio porque el análisis del video no terminó correctamente.');
}

function crearResultadoAudioOmitido(motivo, opcionesAudio, entendimiento, opciones) {
  const resultado = {
    ok: true,
    etapa: 'audio',
    tipo: opcionesAudio.modoAudio,
    omitido: true,
    usarAudioMejorado: false,
    mensaje: motivo,
    rutaAudioMejorado: null,
    nombreAudioMejorado: null,
    opcionesAudio,
    creadoEn: new Date().toISOString()
  };

  return {
    ...resultado,
    impactoAudio: calcularImpactoAudio({ audio: resultado, salida: {}, opciones: { ...opciones, ...opcionesAudio }, entendimiento })
  };
}

export async function mejorarAudioVideo({ entrada, entendimiento, opciones = {} }) {
  validarBaseAudio({ entrada, entendimiento });
  const opcionesAudio = normalizarOpcionesAudio(opciones);

  if (!opcionesAudio.mejorarAudio) {
    return crearResultadoAudioOmitido('Mejora de audio desactivada por opciones del usuario.', opcionesAudio, entendimiento, opciones);
  }

  if (opcionesAudio.modoAudio !== 'limpieza-simple') {
    throw new Error(`Modo de audio no soportado todavía: ${opcionesAudio.modoAudio}`);
  }

  const resultado = await limpiarAudioSimple({ entrada, entendimiento, opciones: { ...opciones, ...opcionesAudio } });

  return {
    ...resultado,
    impactoAudio: calcularImpactoAudio({ audio: resultado, salida: {}, opciones: { ...opciones, ...opcionesAudio }, entendimiento })
  };
}

export default { mejorarAudioVideo };
