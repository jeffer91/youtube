/*
  Nombre completo: calcular-lienzo-vertical.js
  Ruta o ubicación: youtube/editar/tiktok-cuadrado-centro/calcular-lienzo-vertical.js

  Función o funciones:
    - Calcular el lienzo final vertical 9:16.
    - Calcular el tamaño del video cuadrado dentro del lienzo.
    - Calcular las franjas negras superior e inferior.
    - Preparar valores para FFmpeg: scale y pad.

  Con qué se conecta:
    - editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.config.js
    - editar/tiktok-cuadrado-centro/calcular-recorte-cuadrado.js
    - editar/tiktok-cuadrado-centro/construir-filtro-ffmpeg.js
    - editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js
*/

function numeroPositivo(valor, valorPorDefecto) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? Math.round(numero) : valorPorDefecto;
}

function hacerPar(valor) {
  const numero = Math.round(Number(valor));

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return numero % 2 === 0 ? numero : numero - 1;
}

function validarLienzo(anchoFinal, altoFinal, anchoContenido, altoContenido) {
  if (anchoFinal <= 0 || altoFinal <= 0) {
    throw new Error('El lienzo final no es válido.');
  }

  if (anchoContenido <= 0 || altoContenido <= 0) {
    throw new Error('El tamaño del contenido cuadrado no es válido.');
  }

  if (anchoContenido > anchoFinal) {
    throw new Error('El contenido cuadrado no puede ser más ancho que el lienzo final.');
  }

  if (altoContenido > altoFinal) {
    throw new Error('El contenido cuadrado no puede ser más alto que el lienzo final.');
  }
}

export function calcularLienzoVertical({ config, recorte } = {}) {
  const videoConfig = config?.video || {};

  const anchoFinal = hacerPar(numeroPositivo(videoConfig.width, 1080));
  const altoFinal = hacerPar(numeroPositivo(videoConfig.height, 1920));

  /*
    Para este preset queremos contenido cuadrado.
    Por defecto será 1080x1080.
  */
  const anchoContenido = hacerPar(numeroPositivo(videoConfig.contenidoWidth, anchoFinal));
  const altoContenido = hacerPar(numeroPositivo(videoConfig.contenidoHeight, anchoContenido));

  validarLienzo(anchoFinal, altoFinal, anchoContenido, altoContenido);

  const xContenido = hacerPar((anchoFinal - anchoContenido) / 2);
  const yContenido = hacerPar((altoFinal - altoContenido) / 2);

  const franjaSuperior = yContenido;
  const franjaInferior = altoFinal - altoContenido - yContenido;
  const franjaIzquierda = xContenido;
  const franjaDerecha = anchoFinal - anchoContenido - xContenido;

  const colorFondo = videoConfig.colorFondo || 'black';

  return {
    tipo: 'lienzo-vertical-9-16',

    anchoFinal,
    altoFinal,

    anchoContenido,
    altoContenido,

    xContenido,
    yContenido,

    franjaSuperior,
    franjaInferior,
    franjaIzquierda,
    franjaDerecha,

    colorFondo,

    filtroScale: `scale=${anchoContenido}:${altoContenido}:flags=lanczos`,
    filtroPad: `pad=${anchoFinal}:${altoFinal}:${xContenido}:${yContenido}:${colorFondo}`,

    formato: videoConfig.formato || '9:16',

    resumen: {
      salida: `${anchoFinal}x${altoFinal}`,
      contenido: `${anchoContenido}x${altoContenido}`,
      franjasVerticales: `${franjaSuperior}px arriba / ${franjaInferior}px abajo`,
      franjasHorizontales: `${franjaIzquierda}px izquierda / ${franjaDerecha}px derecha`,
      recorteUsado: recorte?.tipo || 'sin-recorte-informado'
    }
  };
}