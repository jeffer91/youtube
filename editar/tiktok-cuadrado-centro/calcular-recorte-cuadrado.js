/*
  Nombre completo: calcular-recorte-cuadrado.js
  Ruta o ubicación: youtube/editar/tiktok-cuadrado-centro/calcular-recorte-cuadrado.js

  Función o funciones:
    - Calcular un recorte cuadrado centrado usando el lado menor del video.
    - Evitar deformación del video.
    - Preparar valores seguros para FFmpeg: crop=lado:lado:x:y.
    - Mantener el centro visual del video original.
    - Devolver medidas claras de lo que se corta arriba, abajo, izquierda y derecha.

  Con qué se conecta:
    - editar/tiktok-cuadrado-centro/normalizar-medidas-video.js
    - editar/tiktok-cuadrado-centro/construir-filtro-ffmpeg.js
    - editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js
*/

function convertirEnteroPositivo(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero <= 0) {
    return null;
  }

  return Math.floor(numero);
}

function hacerPar(valor) {
  /*
    Muchos códecs, especialmente H.264, trabajan mejor con dimensiones pares.
    Por eso hacemos par el lado del recorte y las posiciones.
  */
  const numero = Math.floor(Number(valor));

  if (!Number.isFinite(numero) || numero < 0) {
    return 0;
  }

  return numero % 2 === 0 ? numero : numero - 1;
}

function obtenerAnchoAlto(medidas) {
  const ancho =
    convertirEnteroPositivo(medidas?.anchoOriginal) ??
    convertirEnteroPositivo(medidas?.ancho) ??
    convertirEnteroPositivo(medidas?.width);

  const alto =
    convertirEnteroPositivo(medidas?.altoOriginal) ??
    convertirEnteroPositivo(medidas?.alto) ??
    convertirEnteroPositivo(medidas?.height);

  return { ancho, alto };
}

function calcularOrientacion(ancho, alto) {
  if (ancho > alto) return 'horizontal';
  if (alto > ancho) return 'vertical';
  return 'cuadrada';
}

function calcularMargenesEliminados({ ancho, alto, lado, x, y }) {
  return {
    izquierda: x,
    derecha: ancho - lado - x,
    arriba: y,
    abajo: alto - lado - y
  };
}

function crearExplicacion({ ancho, alto, margenesEliminados }) {
  if (ancho > alto) {
    return `Video horizontal: se conservan ${alto}px de alto completos y se recortan ${margenesEliminados.izquierda}px a la izquierda / ${margenesEliminados.derecha}px a la derecha.`;
  }

  if (alto > ancho) {
    return `Video vertical: se conservan ${ancho}px de ancho completos y se recortan ${margenesEliminados.arriba}px arriba / ${margenesEliminados.abajo}px abajo para crear el cuadrado centrado.`;
  }

  return 'Video cuadrado: no se necesita recorte lateral ni vertical.';
}

export function calcularRecorteCuadrado(medidas) {
  const { ancho, alto } = obtenerAnchoAlto(medidas);

  if (!ancho || !alto) {
    throw new Error('No se puede calcular el recorte cuadrado porque faltan ancho y alto.');
  }

  const ladoBase = Math.min(ancho, alto);
  const lado = hacerPar(ladoBase);

  if (!lado || lado < 2) {
    throw new Error('No se puede calcular el recorte cuadrado porque el lado resultante no es válido.');
  }

  const x = hacerPar((ancho - lado) / 2);
  const y = hacerPar((alto - lado) / 2);
  const margenesEliminados = calcularMargenesEliminados({ ancho, alto, lado, x, y });

  return {
    tipo: 'cuadrado-centrado',
    estrategia: 'centro-geometrico-con-medidas-de-recorte',

    anchoOriginal: ancho,
    altoOriginal: alto,

    anchoRecorte: lado,
    altoRecorte: lado,

    x,
    y,

    orientacionOriginal: calcularOrientacion(ancho, alto),

    margenesEliminados,

    centroOriginal: {
      x: Number((ancho / 2).toFixed(2)),
      y: Number((alto / 2).toFixed(2))
    },

    centroRecorte: {
      x: Number((x + lado / 2).toFixed(2)),
      y: Number((y + lado / 2).toFixed(2))
    },

    filtroCrop: `crop=${lado}:${lado}:${x}:${y}`,

    explicacion: crearExplicacion({
      ancho,
      alto,
      margenesEliminados
    })
  };
}