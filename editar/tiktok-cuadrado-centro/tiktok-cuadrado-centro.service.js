/*
  Nombre completo: tiktok-cuadrado-centro.service.js
  Ruta o ubicación: youtube/editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js

  Función o funciones:
    - Crear el plan de edición TikTok cuadrado centrado.
    - Recortar el video en cuadrado usando el centro del video original.
    - Escalar el contenido a 1080x1080.
    - Montarlo sobre un lienzo vertical 1080x1920 con franjas negras arriba y abajo.
    - Guardar edicion-tiktok-cuadrado-centro.json dentro de la carpeta del proyecto.
    - Devolver una estructura compatible con salida/exportar-simple/exportar.service.js.

  Con qué se conecta:
    - editar/editar.conexion.js
    - editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.config.js
    - editar/tiktok-cuadrado-centro/normalizar-medidas-video.js
    - editar/tiktok-cuadrado-centro/calcular-recorte-cuadrado.js
    - editar/tiktok-cuadrado-centro/calcular-lienzo-vertical.js
    - editar/tiktok-cuadrado-centro/construir-filtro-ffmpeg.js
    - editar/tiktok-cuadrado-centro/crear-nombre-exportado.js
    - comun/archivos.js
    - salida/exportar-simple/exportar.service.js
*/

import path from 'path';
import { escribirJson } from '../../comun/archivos.js';

import { obtenerConfigTikTokCuadradoCentro } from './tiktok-cuadrado-centro.config.js';
import { normalizarMedidasVideo } from './normalizar-medidas-video.js';
import { calcularRecorteCuadrado } from './calcular-recorte-cuadrado.js';
import { calcularLienzoVertical } from './calcular-lienzo-vertical.js';
import { construirDetalleFiltroFfmpeg } from './construir-filtro-ffmpeg.js';
import { crearNombreExportadoTikTokCuadradoCentro } from './crear-nombre-exportado.js';

function validarEntradaServicio({ entrada, entendimiento }) {
  if (!entrada || typeof entrada !== 'object') {
    throw new Error('No se puede crear la edición cuadrado centro porque falta la entrada.');
  }

  if (!entrada?.video?.rutaOriginal) {
    throw new Error('No se puede crear la edición cuadrado centro porque falta la ruta del video original.');
  }

  if (!entrada?.rutas?.carpetaProyecto) {
    throw new Error('No se puede crear la edición cuadrado centro porque falta la carpeta del proyecto.');
  }

  if (!entrada?.proyecto?.id) {
    throw new Error('No se puede crear la edición cuadrado centro porque falta el ID del proyecto.');
  }

  if (!entendimiento || typeof entendimiento !== 'object') {
    throw new Error('No se puede crear la edición cuadrado centro porque falta el entendimiento del video.');
  }

  if (entendimiento.ok !== true) {
    throw new Error('No se puede crear la edición cuadrado centro porque el análisis no terminó correctamente.');
  }
}

function crearNotasEdicion({ recorte, lienzo }) {
  return [
    'Preset TikTok cuadrado centro.',
    'El video se recorta en cuadrado usando el centro geométrico del video original.',
    `Recorte aplicado: ${recorte.anchoRecorte}x${recorte.altoRecorte} desde x=${recorte.x}, y=${recorte.y}.`,
    `Franjas negras: ${lienzo.franjaSuperior}px arriba y ${lienzo.franjaInferior}px abajo.`,
    'El contenido cuadrado se escala a 1080x1080.',
    'La salida final es 1080x1920.',
    'Este preset evita el zoom vertical agresivo del modo simple.'
  ];
}

function construirEdicion({
  entrada,
  entendimiento,
  opciones,
  config,
  medidas,
  recorte,
  lienzo,
  detalleFiltro,
  nombreExportado,
  rutaEdicion,
  nombreArchivoEdicion
}) {
  return {
    ok: true,
    etapa: 'editar',
    tipo: config.nombre,
    plataforma: config.plataforma,
    modo: config.modo,

    preset: {
      nombre: config.nombre,
      version: config.version,
      descripcion: config.descripcion,
      video: config.video,
      recorte: config.recorte,
      exportacion: config.exportacion
    },

    entrada: {
      rutaVideoOriginal: entrada.video.rutaOriginal,
      nombreOriginal: entrada.video.nombreOriginal || null,
      nombreSeguro: entrada.video.nombreSeguro || null,
      orientacionDetectada: medidas.orientacionDetectada,
      medidasOriginales: {
        width: medidas.anchoOriginal,
        height: medidas.altoOriginal,
        fps: medidas.fps,
        duracionSegundos: medidas.duracionSegundos,
        relacionAspectoOriginal: medidas.relacionAspectoOriginal
      },
      tieneAudio: medidas.tieneAudio,
      tieneVideo: medidas.tieneVideo
    },

    composicion: {
      estrategia: 'cuadrado-centrado-en-lienzo-vertical',
      recorte,
      lienzo,
      filtro: detalleFiltro.pasos
    },

    salida: {
      nombreExportado,
      extension: '.mp4',
      formato: config.video.formato,
      width: lienzo.anchoFinal,
      height: lienzo.altoFinal,
      fps: config.video.fps,
      nombreArchivoEdicion,
      rutaEdicion
    },

    render: {
      filtroVideo: detalleFiltro.filtroVideo,
      codecVideo: config.exportacion.codecVideo,
      codecAudio: config.exportacion.codecAudio,
      crf: config.exportacion.crf,
      presetFfmpeg: config.exportacion.presetFfmpeg,
      audioBitrate: config.exportacion.audioBitrate,
      pixFmt: config.exportacion.pixFmt
    },

    opciones: {
      plataforma: opciones?.plataforma || config.plataforma,
      modo: opciones?.modo || config.modo,
      mejorarAudio: opciones?.mejorarAudio ?? null,
      modoAudio: opciones?.modoAudio || null
    },

    auditoria: {
      moduloUsado: 'editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js',
      archivoEdicion: nombreArchivoEdicion,
      rutaEdicion,
      filtroVideo: detalleFiltro.filtroVideo,
      recorteResumen: recorte.explicacion,
      lienzoResumen: lienzo.resumen
    },

    notas: crearNotasEdicion({ recorte, lienzo }),
    creadoEn: new Date().toISOString()
  };
}

export async function crearEdicionTikTokCuadradoCentro({
  entrada,
  entendimiento,
  opciones = {}
} = {}) {
  validarEntradaServicio({ entrada, entendimiento });

  const config = obtenerConfigTikTokCuadradoCentro();

  const medidas = normalizarMedidasVideo({
    entrada,
    entendimiento,
    config
  });

  const recorte = calcularRecorteCuadrado(medidas);

  const lienzo = calcularLienzoVertical({
    config,
    recorte
  });

  const detalleFiltro = construirDetalleFiltroFfmpeg({
    recorte,
    lienzo,
    medidas,
    config
  });

  const nombreExportado = crearNombreExportadoTikTokCuadradoCentro({
    entrada,
    config
  });

  const nombreArchivoEdicion =
    config.archivos?.nombreEdicion || 'edicion-tiktok-cuadrado-centro.json';

  const rutaEdicion = path.join(entrada.rutas.carpetaProyecto, nombreArchivoEdicion);

  const edicion = construirEdicion({
    entrada,
    entendimiento,
    opciones: {
      ...opciones,
      plataforma: config.plataforma,
      modo: config.modo
    },
    config,
    medidas,
    recorte,
    lienzo,
    detalleFiltro,
    nombreExportado,
    rutaEdicion,
    nombreArchivoEdicion
  });

  await escribirJson(rutaEdicion, edicion);

  return {
    ...edicion,
    rutaEdicion
  };
}