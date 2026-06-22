/*
  Nombre completo: perfiles-audio-inteligente.js
  Ruta o ubicación: AutoVideoJeff/audio/audio-inteligente/perfiles-audio-inteligente.js
  Función o funciones:
    - Definir perfiles profesionales de tratamiento de voz para AutoVideoJeff.
    - Guardar parámetros seguros de limpieza, ecualización, compresión, normalización y limitador.
    - Permitir que el clasificador escoja un perfil según el análisis del audio.
    - Entregar un perfil seguro cuando el audio no se pueda clasificar con confianza.
  Con qué se conecta:
    - audio/audio-inteligente/clasificar-audio.service.js
    - audio/audio-inteligente/construir-cadena-audio.js
    - audio/audio-inteligente/audio-inteligente.service.js
    - biblioteca/audio-inteligente-pro.json
*/

export const PERFIL_AUDIO_SEGURO = 'seguro';
export const PERFIL_AUDIO_ESTANDAR = 'voz-estandar';

const BASE_LOUDNORM = Object.freeze({
  activo: true,
  intensidadIntegrada: -16,
  truePeak: -1.5,
  rangoLoudness: 10
});

const BASE_LIMITADOR = Object.freeze({
  activo: true,
  limite: 0.95,
  attack: 5,
  release: 70
});

const BASE_COMPRESOR = Object.freeze({
  activo: true,
  thresholdDb: -18,
  ratio: 2.4,
  attackMs: 12,
  releaseMs: 180,
  makeupDb: 1.5
});

export const PERFILES_AUDIO_INTELIGENTE = Object.freeze({
  'seguro': Object.freeze({
    id: 'seguro',
    nombre: 'Seguro',
    prioridad: 100,
    descripcion: 'Tratamiento moderado para mejorar voz sin arriesgar distorsión ni sonido robótico.',
    uso: 'Cuando el análisis no es claro o se requiere máxima estabilidad.',
    filtros: Object.freeze({
      highpassHz: 80,
      lowpassHz: 14500,
      reduccionRuido: Object.freeze({ activo: true, noiseFloorDb: -30, reduccion: 8, seguimientoRuido: true }),
      ecualizacion: Object.freeze([
        Object.freeze({ frecuenciaHz: 120, ancho: 1.0, gananciaDb: -1.2 }),
        Object.freeze({ frecuenciaHz: 3200, ancho: 1.1, gananciaDb: 1.8 }),
        Object.freeze({ frecuenciaHz: 7200, ancho: 1.2, gananciaDb: 0.8 })
      ]),
      gananciaInicialDb: 0,
      compresor: BASE_COMPRESOR,
      loudnorm: BASE_LOUDNORM,
      limitador: BASE_LIMITADOR
    })
  }),

  'voz-estandar': Object.freeze({
    id: 'voz-estandar',
    nombre: 'Voz estándar',
    prioridad: 10,
    descripcion: 'Limpieza equilibrada para voz hablada con ruido leve o normal.',
    uso: 'Videos con voz entendible, volumen aceptable y ruido de fondo bajo o medio.',
    filtros: Object.freeze({
      highpassHz: 82,
      lowpassHz: 15000,
      reduccionRuido: Object.freeze({ activo: true, noiseFloorDb: -28, reduccion: 10, seguimientoRuido: true }),
      ecualizacion: Object.freeze([
        Object.freeze({ frecuenciaHz: 110, ancho: 1.0, gananciaDb: -1.8 }),
        Object.freeze({ frecuenciaHz: 240, ancho: 1.0, gananciaDb: -0.8 }),
        Object.freeze({ frecuenciaHz: 3200, ancho: 1.0, gananciaDb: 2.3 }),
        Object.freeze({ frecuenciaHz: 8000, ancho: 1.3, gananciaDb: 1.1 })
      ]),
      gananciaInicialDb: 0.6,
      compresor: Object.freeze({ ...BASE_COMPRESOR, thresholdDb: -19, ratio: 2.6, makeupDb: 2 }),
      loudnorm: BASE_LOUDNORM,
      limitador: BASE_LIMITADOR
    })
  }),

  'voz-muy-baja': Object.freeze({
    id: 'voz-muy-baja',
    nombre: 'Voz muy baja',
    prioridad: 20,
    descripcion: 'Recupera voz débil con ganancia controlada, compresión y loudness final.',
    uso: 'Videos donde la voz se escucha lejana, baja o con poca presencia.',
    filtros: Object.freeze({
      highpassHz: 85,
      lowpassHz: 14500,
      reduccionRuido: Object.freeze({ activo: true, noiseFloorDb: -32, reduccion: 12, seguimientoRuido: true }),
      ecualizacion: Object.freeze([
        Object.freeze({ frecuenciaHz: 120, ancho: 1.0, gananciaDb: -2.3 }),
        Object.freeze({ frecuenciaHz: 450, ancho: 1.2, gananciaDb: -0.9 }),
        Object.freeze({ frecuenciaHz: 2800, ancho: 1.0, gananciaDb: 2.8 }),
        Object.freeze({ frecuenciaHz: 6200, ancho: 1.3, gananciaDb: 1.5 })
      ]),
      gananciaInicialDb: 4.2,
      compresor: Object.freeze({ ...BASE_COMPRESOR, thresholdDb: -24, ratio: 3.1, attackMs: 10, releaseMs: 220, makeupDb: 3.2 }),
      loudnorm: Object.freeze({ ...BASE_LOUDNORM, intensidadIntegrada: -15, truePeak: -1.3, rangoLoudness: 9 }),
      limitador: Object.freeze({ ...BASE_LIMITADOR, limite: 0.93 })
    })
  }),

  'ruido-fuerte': Object.freeze({
    id: 'ruido-fuerte',
    nombre: 'Ruido fuerte',
    prioridad: 30,
    descripcion: 'Reduce ruido constante de ambiente sin borrar completamente la naturalidad de la voz.',
    uso: 'Ventiladores, calle, cuarto ruidoso, zumbidos o ambiente constante.',
    filtros: Object.freeze({
      highpassHz: 95,
      lowpassHz: 12500,
      reduccionRuido: Object.freeze({ activo: true, noiseFloorDb: -24, reduccion: 18, seguimientoRuido: true }),
      ecualizacion: Object.freeze([
        Object.freeze({ frecuenciaHz: 100, ancho: 0.9, gananciaDb: -3.2 }),
        Object.freeze({ frecuenciaHz: 220, ancho: 1.1, gananciaDb: -1.6 }),
        Object.freeze({ frecuenciaHz: 3000, ancho: 1.0, gananciaDb: 2.2 }),
        Object.freeze({ frecuenciaHz: 6800, ancho: 1.4, gananciaDb: 0.6 })
      ]),
      gananciaInicialDb: 0.4,
      compresor: Object.freeze({ ...BASE_COMPRESOR, thresholdDb: -20, ratio: 2.8, makeupDb: 1.8 }),
      loudnorm: Object.freeze({ ...BASE_LOUDNORM, rangoLoudness: 9 }),
      limitador: BASE_LIMITADOR
    })
  }),

  'voz-saturada': Object.freeze({
    id: 'voz-saturada',
    nombre: 'Voz saturada',
    prioridad: 40,
    descripcion: 'Protege un audio con picos altos o posible saturación para no empeorarlo.',
    uso: 'Audio reventado, muy fuerte o con picos cerca de 0 dB.',
    filtros: Object.freeze({
      highpassHz: 80,
      lowpassHz: 13500,
      reduccionRuido: Object.freeze({ activo: true, noiseFloorDb: -30, reduccion: 7, seguimientoRuido: true }),
      ecualizacion: Object.freeze([
        Object.freeze({ frecuenciaHz: 130, ancho: 1.0, gananciaDb: -1.4 }),
        Object.freeze({ frecuenciaHz: 2500, ancho: 1.2, gananciaDb: 0.8 }),
        Object.freeze({ frecuenciaHz: 6000, ancho: 1.5, gananciaDb: -0.8 })
      ]),
      gananciaInicialDb: -3.2,
      compresor: Object.freeze({ ...BASE_COMPRESOR, thresholdDb: -14, ratio: 1.8, attackMs: 6, releaseMs: 140, makeupDb: 0 }),
      loudnorm: Object.freeze({ ...BASE_LOUDNORM, intensidadIntegrada: -17, truePeak: -2.0, rangoLoudness: 11 }),
      limitador: Object.freeze({ ...BASE_LIMITADOR, limite: 0.90, attack: 3, release: 90 })
    })
  }),

  'volumen-irregular': Object.freeze({
    id: 'volumen-irregular',
    nombre: 'Volumen irregular',
    prioridad: 50,
    descripcion: 'Estabiliza partes muy bajas y muy altas con compresión controlada.',
    uso: 'Videos con cambios bruscos de volumen, partes lejanas y partes muy fuertes.',
    filtros: Object.freeze({
      highpassHz: 85,
      lowpassHz: 14500,
      reduccionRuido: Object.freeze({ activo: true, noiseFloorDb: -29, reduccion: 11, seguimientoRuido: true }),
      ecualizacion: Object.freeze([
        Object.freeze({ frecuenciaHz: 115, ancho: 1.0, gananciaDb: -2.0 }),
        Object.freeze({ frecuenciaHz: 3000, ancho: 1.1, gananciaDb: 2.0 }),
        Object.freeze({ frecuenciaHz: 7600, ancho: 1.4, gananciaDb: 0.9 })
      ]),
      gananciaInicialDb: 1.2,
      compresor: Object.freeze({ ...BASE_COMPRESOR, thresholdDb: -23, ratio: 3.6, attackMs: 9, releaseMs: 260, makeupDb: 2.4 }),
      loudnorm: Object.freeze({ ...BASE_LOUDNORM, intensidadIntegrada: -16, rangoLoudness: 8 }),
      limitador: BASE_LIMITADOR
    })
  }),

  'voz-opaca': Object.freeze({
    id: 'voz-opaca',
    nombre: 'Voz opaca',
    prioridad: 60,
    descripcion: 'Da claridad y presencia a una voz encerrada o sin brillo.',
    uso: 'Audio apagado, grabado lejos o con poca definición.',
    filtros: Object.freeze({
      highpassHz: 90,
      lowpassHz: 16000,
      reduccionRuido: Object.freeze({ activo: true, noiseFloorDb: -30, reduccion: 9, seguimientoRuido: true }),
      ecualizacion: Object.freeze([
        Object.freeze({ frecuenciaHz: 120, ancho: 1.0, gananciaDb: -2.0 }),
        Object.freeze({ frecuenciaHz: 500, ancho: 1.1, gananciaDb: -1.0 }),
        Object.freeze({ frecuenciaHz: 3400, ancho: 1.0, gananciaDb: 3.0 }),
        Object.freeze({ frecuenciaHz: 9000, ancho: 1.3, gananciaDb: 1.8 })
      ]),
      gananciaInicialDb: 1.2,
      compresor: Object.freeze({ ...BASE_COMPRESOR, thresholdDb: -19, ratio: 2.5, makeupDb: 2.2 }),
      loudnorm: BASE_LOUDNORM,
      limitador: BASE_LIMITADOR
    })
  }),

  'voz-chillona': Object.freeze({
    id: 'voz-chillona',
    nombre: 'Voz chillona',
    prioridad: 70,
    descripcion: 'Suaviza agudos agresivos y reduce fatiga de escucha.',
    uso: 'Voz muy brillante, metálica, aguda o molesta.',
    filtros: Object.freeze({
      highpassHz: 75,
      lowpassHz: 10500,
      reduccionRuido: Object.freeze({ activo: true, noiseFloorDb: -31, reduccion: 8, seguimientoRuido: true }),
      ecualizacion: Object.freeze([
        Object.freeze({ frecuenciaHz: 120, ancho: 1.0, gananciaDb: -1.0 }),
        Object.freeze({ frecuenciaHz: 3000, ancho: 1.2, gananciaDb: 1.0 }),
        Object.freeze({ frecuenciaHz: 5800, ancho: 1.0, gananciaDb: -2.4 }),
        Object.freeze({ frecuenciaHz: 9200, ancho: 1.3, gananciaDb: -1.8 })
      ]),
      gananciaInicialDb: -0.4,
      compresor: Object.freeze({ ...BASE_COMPRESOR, thresholdDb: -17, ratio: 2.2, makeupDb: 1.2 }),
      loudnorm: Object.freeze({ ...BASE_LOUDNORM, truePeak: -1.7 }),
      limitador: BASE_LIMITADOR
    })
  }),

  'voz-con-silencios': Object.freeze({
    id: 'voz-con-silencios',
    nombre: 'Voz con silencios',
    prioridad: 80,
    descripcion: 'Mejora voz manteniendo silencios naturales sin amplificar demasiado el ruido.',
    uso: 'Videos con pausas largas, silencios o espacios sin voz.',
    filtros: Object.freeze({
      highpassHz: 82,
      lowpassHz: 14000,
      reduccionRuido: Object.freeze({ activo: true, noiseFloorDb: -34, reduccion: 9, seguimientoRuido: true }),
      ecualizacion: Object.freeze([
        Object.freeze({ frecuenciaHz: 120, ancho: 1.0, gananciaDb: -1.6 }),
        Object.freeze({ frecuenciaHz: 3100, ancho: 1.0, gananciaDb: 2.2 }),
        Object.freeze({ frecuenciaHz: 7600, ancho: 1.3, gananciaDb: 0.9 })
      ]),
      gananciaInicialDb: 0.8,
      compresor: Object.freeze({ ...BASE_COMPRESOR, thresholdDb: -20, ratio: 2.4, makeupDb: 1.8 }),
      loudnorm: Object.freeze({ ...BASE_LOUDNORM, rangoLoudness: 11 }),
      limitador: BASE_LIMITADOR
    })
  })
});

export function obtenerPerfilesAudioInteligente() {
  return Object.values(PERFILES_AUDIO_INTELIGENTE).map((perfil) => ({ ...perfil }));
}

export function obtenerPerfilPorId(perfilId) {
  if (!perfilId || typeof perfilId !== 'string') {
    return null;
  }

  return PERFILES_AUDIO_INTELIGENTE[perfilId.trim().toLowerCase()] || null;
}

export function obtenerPerfilSeguro() {
  return PERFILES_AUDIO_INTELIGENTE[PERFIL_AUDIO_SEGURO];
}

export function normalizarPerfilAudio(perfilId) {
  return obtenerPerfilPorId(perfilId) || obtenerPerfilSeguro();
}

export function listarIdsPerfilesAudio() {
  return Object.keys(PERFILES_AUDIO_INTELIGENTE);
}

export default PERFILES_AUDIO_INTELIGENTE;
