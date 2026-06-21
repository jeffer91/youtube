/*
  Nombre completo: tiktok.service.js
  Ruta o ubicación: AutoVideoJeff/editar/tiktok-simple/tiktok.service.js
  Función o funciones:
    - Crear el plan de edición simple para TikTok.
    - Definir formato vertical 9:16.
    - Preparar filtros de video para centrar, escalar y rellenar fondo.
    - Leer el preset desde biblioteca/tiktok-simple.json.
    - Guardar un archivo edicion-tiktok-simple.json dentro del proyecto.
  Con qué se conecta:
    - editar/editar.conexion.js
    - biblioteca/tiktok-simple.json
    - salida/exportar-simple/exportar.service.js
    - comun/archivos.js
*/

import path from 'path';
import { fileURLToPath } from 'url';
import { escribirJson, leerJsonSiExiste } from '../../comun/archivos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function obtenerRutaPreset() {
  return path.resolve(__dirname, '../../biblioteca/tiktok-simple.json');
}

async function leerPreset() {
  const preset = await leerJsonSiExiste(obtenerRutaPreset(), null);

  if (!preset) {
    throw new Error('No se encontró el preset biblioteca/tiktok-simple.json.');
  }

  return preset;
}

function obtenerFiltroVertical(preset) {
  const ancho = preset.video.width;
  const alto = preset.video.height;
  const fps = preset.video.fps;

  return [
    `scale=${ancho}:${alto}:force_original_aspect_ratio=increase`,
    `crop=${ancho}:${alto}`,
    `fps=${fps}`,
    'setsar=1'
  ].join(',');
}

function crearNombreExportado(entrada) {
  const base = entrada.proyecto?.nombre || 'video';
  const fecha = new Date().toISOString().slice(0, 10);
  return `${base}-tiktok-${fecha}-${entrada.proyecto.id}.mp4`;
}

export async function crearEdicionTikTokSimple({ entrada, entendimiento }) {
  const preset = await leerPreset();
  const filtroVideo = obtenerFiltroVertical(preset);
  const nombreExportado = crearNombreExportado(entrada);
  const rutaEdicion = path.join(entrada.rutas.carpetaProyecto, 'edicion-tiktok-simple.json');

  const edicion = {
    ok: true,
    etapa: 'editar',
    tipo: 'tiktok-simple',
    plataforma: 'tiktok',
    preset,
    entrada: {
      rutaVideoOriginal: entrada.video.rutaOriginal,
      orientacionDetectada: entendimiento?.analisis?.orientacion || 'desconocida'
    },
    salida: {
      nombreExportado,
      extension: '.mp4',
      formato: '9:16',
      width: preset.video.width,
      height: preset.video.height,
      fps: preset.video.fps
    },
    render: {
      filtroVideo,
      codecVideo: preset.exportacion.codecVideo,
      codecAudio: preset.exportacion.codecAudio,
      crf: preset.exportacion.crf,
      presetFfmpeg: preset.exportacion.presetFfmpeg
    },
    notas: [
      'Primera edición simple: convierte el video a 9:16 para TikTok.',
      'Los subtítulos, cortes inteligentes, textos y transiciones se agregarán después como submódulos.'
    ],
    creadoEn: new Date().toISOString()
  };

  await escribirJson(rutaEdicion, edicion);

  return {
    ...edicion,
    rutaEdicion
  };
}
