/*
  Nombre completo: construir-filtro-ffmpeg.js
  Ruta o ubicación: youtube/editar/tiktok-cuadrado-centro/construir-filtro-ffmpeg.js

  Función o funciones:
    - Construir el filtro final de FFmpeg para el preset TikTok cuadrado centrado.
    - Unir crop + scale + pad + fps + setsar + format.
    - Devolver un filtro compatible con salida/exportar-simple/exportar.service.js.
    - Mantener separado el armado de FFmpeg para poder crear más estilos después.

  Con qué se conecta:
    - editar/tiktok-cuadrado-centro/calcular-recorte-cuadrado.js
    - editar/tiktok-cuadrado-centro/calcular-lienzo-vertical.js
    - editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.config.js
    - editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js
    - salida/exportar-simple/exportar.service.js
*/

function numeroPositivo(valor, valorPorDefecto) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : valorPorDefecto;
}

function limpiarFiltro(filtro) {
  if (typeof filtro !== 'string') {
    return null;
  }

  const limpio = filtro.trim();

  return limpio.length > 0 ? limpio : null;
}

function validarPartesFiltro({ recorte, lienzo }) {
  if (!recorte?.filtroCrop) {
    throw new Error('No se puede construir el filtro FFmpeg porque falta filtroCrop.');
  }

  if (!lienzo?.filtroScale) {
    throw new Error('No se puede construir el filtro FFmpeg porque falta filtroScale.');
  }

  if (!lienzo?.filtroPad) {
    throw new Error('No se puede construir el filtro FFmpeg porque falta filtroPad.');
  }
}

export function construirFiltroFfmpeg({ recorte, lienzo, medidas, config } = {}) {
  validarPartesFiltro({ recorte, lienzo });

  const fps = numeroPositivo(medidas?.fps, config?.video?.fps || 30);
  const sar = numeroPositivo(config?.video?.sar, 1);
  const pixFmt = config?.exportacion?.pixFmt || 'yuv420p';

  const filtros = [
    limpiarFiltro(recorte.filtroCrop),
    limpiarFiltro(lienzo.filtroScale),
    limpiarFiltro(lienzo.filtroPad),
    `fps=${fps}`,
    `setsar=${sar}`,
    `format=${pixFmt}`
  ].filter(Boolean);

  return filtros.join(',');
}

export function construirDetalleFiltroFfmpeg({ recorte, lienzo, medidas, config } = {}) {
  const filtroVideo = construirFiltroFfmpeg({
    recorte,
    lienzo,
    medidas,
    config
  });

  return {
    filtroVideo,

    pasos: {
      crop: {
        descripcion: 'Recorte cuadrado centrado.',
        filtro: recorte.filtroCrop,
        ancho: recorte.anchoRecorte,
        alto: recorte.altoRecorte,
        x: recorte.x,
        y: recorte.y
      },

      scale: {
        descripcion: 'Escalado del contenido cuadrado.',
        filtro: lienzo.filtroScale,
        ancho: lienzo.anchoContenido,
        alto: lienzo.altoContenido
      },

      pad: {
        descripcion: 'Lienzo vertical con franjas negras.',
        filtro: lienzo.filtroPad,
        anchoFinal: lienzo.anchoFinal,
        altoFinal: lienzo.altoFinal,
        xContenido: lienzo.xContenido,
        yContenido: lienzo.yContenido,
        colorFondo: lienzo.colorFondo
      },

      fps: {
        descripcion: 'Normalización de FPS.',
        valor: numeroPositivo(medidas?.fps, config?.video?.fps || 30)
      },

      formatoPixel: {
        descripcion: 'Formato compatible para reproducción estable.',
        valor: config?.exportacion?.pixFmt || 'yuv420p'
      }
    },

    resumen:
      'Filtro construido: recorte cuadrado centrado, escala 1080x1080 y lienzo vertical 1080x1920 con franjas negras.'
  };
}