/*
  Nombre completo: clasificar-audio.service.js
  Ruta o ubicación: AutoVideoJeff/audio/audio-inteligente/clasificar-audio.service.js
  Función o funciones:
    - Clasificar el audio analizado antes de aplicar filtros.
    - Elegir el perfil de mejora más adecuado según volumen, picos, silencios y señales técnicas.
    - Generar explicación legible para mostrar en reportes o interfaz.
    - Mantener un perfil seguro cuando no existan datos suficientes.
  Con qué se conecta:
    - audio/audio-inteligente/analizar-audio.service.js
    - audio/audio-inteligente/perfiles-audio-inteligente.js
    - audio/audio-inteligente/construir-cadena-audio.js
    - audio/audio-inteligente/audio-inteligente.service.js
*/

import { obtenerConfigAudioInteligente } from './audio-inteligente.config.js';
import {
  obtenerPerfilPorId,
  obtenerPerfilSeguro,
  PERFIL_AUDIO_ESTANDAR,
  PERFIL_AUDIO_SEGURO
} from './perfiles-audio-inteligente.js';

function crearMotivo(codigo, mensaje, peso = 1) {
  return { codigo, mensaje, peso };
}

function obtenerSenales(analisis) {
  return analisis?.senales || {};
}

function obtenerVolumen(analisis) {
  return analisis?.volumen || {};
}

function crearResultado({ perfilId, confianza, motivos, analisis, config, estado = 'clasificado' }) {
  const perfil = obtenerPerfilPorId(perfilId) || obtenerPerfilSeguro();
  const calidad = config.calidadSeleccionada || config.calidad?.predeterminada || 'inteligente';

  return {
    ok: true,
    estado,
    perfilId: perfil.id,
    perfilNombre: perfil.nombre,
    perfilDescripcion: perfil.descripcion,
    calidad,
    confianza,
    motivos,
    resumen: {
      duracionSegundos: analisis?.resumen?.duracionSegundos || analisis?.metadata?.duracionSegundos || null,
      volumenMedioDb: analisis?.resumen?.volumenMedioDb ?? obtenerVolumen(analisis).volumenMedioDb ?? null,
      volumenMaximoDb: analisis?.resumen?.volumenMaximoDb ?? obtenerVolumen(analisis).volumenMaximoDb ?? null,
      porcentajeSilencio: analisis?.resumen?.porcentajeSilencio ?? obtenerSenales(analisis).porcentajeSilencio ?? null,
      rangoDinamicoAproximadoDb: analisis?.resumen?.rangoDinamicoAproximadoDb ?? obtenerSenales(analisis).rangoDinamicoAproximadoDb ?? null
    },
    perfil,
    recomendacion: {
      usarAudioInteligente: true,
      fallbackSimplePermitido: Boolean(config.fallback?.permitirLimpiezaSimple),
      mensaje: `Aplicar perfil ${perfil.nombre} con calidad ${calidad}.`
    }
  };
}

function sumarPeso(motivos) {
  return motivos.reduce((total, motivo) => total + (Number(motivo.peso) || 0), 0);
}

export function clasificarAudioInteligente(analisis, opciones = {}) {
  const config = obtenerConfigAudioInteligente(opciones);
  const motivos = [];

  if (!analisis || typeof analisis !== 'object') {
    motivos.push(crearMotivo('sin-analisis', 'No existe análisis de audio. Se usará perfil seguro.', 1));
    return crearResultado({
      perfilId: PERFIL_AUDIO_SEGURO,
      confianza: 'baja',
      motivos,
      analisis: {},
      config,
      estado: 'fallback'
    });
  }

  if (!analisis.tieneAudio || analisis.ok === false) {
    return {
      ok: false,
      estado: 'sin-audio',
      perfilId: null,
      perfilNombre: null,
      confianza: 'alta',
      motivos: [
        crearMotivo('sin-pista-audio', analisis.motivo || 'El video no tiene pista de audio utilizable.', 10)
      ],
      recomendacion: {
        usarAudioInteligente: false,
        fallbackSimplePermitido: false,
        mensaje: 'No se puede mejorar audio porque no existe una pista de audio detectable.'
      }
    };
  }

  const senales = obtenerSenales(analisis);
  const volumen = obtenerVolumen(analisis);

  if (senales.posibleSaturacion) {
    motivos.push(crearMotivo('posible-saturacion', 'El audio tiene picos demasiado cerca de 0 dB.', 10));
    return crearResultado({ perfilId: 'voz-saturada', confianza: 'alta', motivos, analisis, config });
  }

  if (senales.cercaDeClipping) {
    motivos.push(crearMotivo('cerca-clipping', 'El audio está cerca del límite de saturación.', 8));
    return crearResultado({ perfilId: 'voz-saturada', confianza: 'media', motivos, analisis, config });
  }

  if (senales.vozMuyBaja) {
    motivos.push(crearMotivo('voz-muy-baja', 'La voz está muy baja y necesita ganancia controlada.', 9));

    if (senales.volumenIrregular) {
      motivos.push(crearMotivo('tambien-irregular', 'Además existen cambios fuertes de volumen.', 3));
    }

    return crearResultado({ perfilId: 'voz-muy-baja', confianza: 'alta', motivos, analisis, config });
  }

  if (senales.volumenIrregular) {
    motivos.push(crearMotivo('volumen-irregular', 'Hay mucha diferencia entre volumen medio y picos.', 8));
    return crearResultado({ perfilId: 'volumen-irregular', confianza: 'alta', motivos, analisis, config });
  }

  if (senales.vozBaja) {
    motivos.push(crearMotivo('voz-baja', 'La voz está por debajo del nivel recomendado.', 6));
    return crearResultado({ perfilId: 'voz-muy-baja', confianza: 'media', motivos, analisis, config });
  }

  if (senales.silenciosExcesivos) {
    motivos.push(crearMotivo('silencios-excesivos', 'El audio tiene demasiados silencios o pausas largas.', 7));
    return crearResultado({ perfilId: 'voz-con-silencios', confianza: 'alta', motivos, analisis, config });
  }

  if (senales.silenciosAltos) {
    motivos.push(crearMotivo('silencios-altos', 'El audio tiene varias pausas o zonas sin voz.', 5));
    return crearResultado({ perfilId: 'voz-con-silencios', confianza: 'media', motivos, analisis, config });
  }

  if (opciones?.tipoVoz === 'opaca' || opciones?.audioOpaco === true) {
    motivos.push(crearMotivo('indicio-voz-opaca', 'Se solicitó reforzar claridad y presencia de voz.', 6));
    return crearResultado({ perfilId: 'voz-opaca', confianza: 'media', motivos, analisis, config });
  }

  if (opciones?.tipoVoz === 'chillona' || opciones?.audioChillon === true) {
    motivos.push(crearMotivo('indicio-voz-chillona', 'Se solicitó suavizar agudos molestos.', 6));
    return crearResultado({ perfilId: 'voz-chillona', confianza: 'media', motivos, analisis, config });
  }

  if (opciones?.ruidoFuerte === true || opciones?.nivelRuido === 'alto') {
    motivos.push(crearMotivo('ruido-fuerte-indicado', 'Se indicó ruido de fondo fuerte desde opciones.', 7));
    return crearResultado({ perfilId: 'ruido-fuerte', confianza: 'media', motivos, analisis, config });
  }

  if (volumen.disponible === false) {
    motivos.push(crearMotivo('volumen-no-disponible', 'No hay métricas suficientes de volumen. Se usará perfil seguro.', 4));
    return crearResultado({ perfilId: PERFIL_AUDIO_SEGURO, confianza: 'baja', motivos, analisis, config, estado: 'fallback' });
  }

  motivos.push(crearMotivo('audio-normal', 'El audio parece apto para limpieza y masterización estándar.', 5));

  const pesoTotal = sumarPeso(motivos);
  const confianza = pesoTotal >= 8 ? 'alta' : pesoTotal >= 5 ? 'media' : 'baja';

  return crearResultado({
    perfilId: PERFIL_AUDIO_ESTANDAR,
    confianza,
    motivos,
    analisis,
    config
  });
}

export function resumirClasificacionAudio(clasificacion) {
  if (!clasificacion || typeof clasificacion !== 'object') {
    return 'Clasificación de audio no disponible.';
  }

  if (clasificacion.ok === false) {
    return clasificacion.recomendacion?.mensaje || 'No se puede aplicar mejora de audio.';
  }

  const motivos = Array.isArray(clasificacion.motivos)
    ? clasificacion.motivos.map((motivo) => motivo.mensaje).join(' ')
    : '';

  return `Perfil seleccionado: ${clasificacion.perfilNombre}. Confianza: ${clasificacion.confianza}. ${motivos}`.trim();
}

export default clasificarAudioInteligente;
