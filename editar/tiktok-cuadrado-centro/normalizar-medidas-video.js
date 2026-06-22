/*
  Nombre completo: normalizar-medidas-video.js
  Ruta o ubicación: youtube/editar/tiktok-cuadrado-centro/normalizar-medidas-video.js

  Función o funciones:
    - Leer las medidas técnicas del video desde entendimiento.analisis.
    - Normalizar ancho, alto, FPS, duración, orientación y audio.
    - Entregar datos seguros para calcular el recorte cuadrado.
    - Evitar que el servicio principal tenga validaciones mezcladas.

  Con qué se conecta:
    - entender/analisis-simple/analisis.service.js
    - editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.config.js
    - editar/tiktok-cuadrado-centro/calcular-recorte-cuadrado.js
    - editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js
*/

function convertirNumero(valor, valorPorDefecto = null) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : valorPorDefecto;
}

function convertirNumeroPositivo(valor, valorPorDefecto = null) {
  const numero = convertirNumero(valor, null);
  return numero !== null && numero > 0 ? numero : valorPorDefecto;
}

function redondearEntero(valor, valorPorDefecto = null) {
  const numero = convertirNumeroPositivo(valor, valorPorDefecto);

  if (numero === null) {
    return null;
  }

  return Math.round(numero);
}

function normalizarTexto(valor, valorPorDefecto = '') {
  if (typeof valor !== 'string') {
    return valorPorDefecto;
  }

  const limpio = valor.trim();

  return limpio.length > 0 ? limpio : valorPorDefecto;
}

function calcularOrientacion(ancho, alto) {
  if (!ancho || !alto) {
    return 'desconocida';
  }

  if (ancho > alto) {
    return 'horizontal';
  }

  if (alto > ancho) {
    return 'vertical';
  }

  return 'cuadrada';
}

function resolverAnalisis(entendimiento) {
  /*
    El flujo actual entrega:
      entendimiento.analisis.ancho
      entendimiento.analisis.alto
      entendimiento.analisis.fps

    Pero se aceptan alias por seguridad para que el preset siga funcionando
    si después cambiamos nombres internos.
  */
  if (entendimiento?.analisis && typeof entendimiento.analisis === 'object') {
    return entendimiento.analisis;
  }

  if (entendimiento && typeof entendimiento === 'object') {
    return entendimiento;
  }

  return {};
}

export function normalizarMedidasVideo({ entrada, entendimiento, config } = {}) {
  const analisis = resolverAnalisis(entendimiento);

  const anchoOriginal = redondearEntero(
    analisis.ancho ??
      analisis.width ??
      analisis.videoWidth ??
      entrada?.video?.ancho ??
      entrada?.video?.width,
    null
  );

  const altoOriginal = redondearEntero(
    analisis.alto ??
      analisis.height ??
      analisis.videoHeight ??
      entrada?.video?.alto ??
      entrada?.video?.height,
    null
  );

  if (!anchoOriginal || !altoOriginal) {
    throw new Error(
      'No se puede crear el preset cuadrado centrado porque faltan ancho y alto reales del video.'
    );
  }

  const fpsConfig = convertirNumeroPositivo(config?.video?.fps, 30);
  const fpsDetectado = convertirNumeroPositivo(analisis.fps, null);
  const fps = fpsDetectado || fpsConfig;

  const duracionSegundos = convertirNumeroPositivo(
    analisis.duracionSegundos ?? analisis.duration ?? analisis.duracion,
    null
  );

  const orientacionDetectada = normalizarTexto(
    analisis.orientacion,
    calcularOrientacion(anchoOriginal, altoOriginal)
  );

  const tieneAudio = Boolean(analisis.tieneAudio);
  const tieneVideo = analisis.tieneVideo === false ? false : true;

  if (!tieneVideo) {
    throw new Error('No se puede editar porque el análisis indica que el archivo no tiene video.');
  }

  return {
    anchoOriginal,
    altoOriginal,
    fps,
    duracionSegundos,
    orientacionDetectada,
    tieneAudio,
    tieneVideo,

    codecVideo: analisis.codecVideo || null,
    codecAudio: analisis.codecAudio || null,
    pesoBytes: convertirNumeroPositivo(analisis.pesoBytes, null),
    formatoOriginal: analisis.formato || null,

    relacionAspectoOriginal: Number((anchoOriginal / altoOriginal).toFixed(4)),

    origen: {
      metodoAnalisis: analisis.metodo || 'desconocido',
      nombreOriginal: entrada?.video?.nombreOriginal || null,
      rutaOriginal: entrada?.video?.rutaOriginal || null
    }
  };
}