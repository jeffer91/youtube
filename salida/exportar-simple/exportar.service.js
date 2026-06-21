/*
  Nombre completo: exportar.service.js
  Ruta o ubicación: AutoVideoJeff/salida/exportar-simple/exportar.service.js
  Función o funciones:
    - Ejecutar la generación final del video.
    - Guardar el archivo final en datos/videos-exportados/.
    - Guardar un resumen de salida dentro del proyecto.
    - Devolver una URL local para mostrar el resultado en la pantalla principal.
  Con qué se conecta:
    - salida/salida.conexion.js
    - editar/tiktok-simple/tiktok.service.js
    - comun/ffmpeg.js
    - comun/archivos.js
    - datos/videos-exportados/
*/

import path from 'path';
import { exportarConFfmpeg } from '../../comun/ffmpeg.js';
import { asegurarCarpeta, escribirJson, obtenerRutaRaiz } from '../../comun/archivos.js';

export async function exportarVideoSimple({ entrada, entendimiento, edicion }) {
  const raiz = obtenerRutaRaiz();
  const carpetaExportados = path.join(raiz, 'datos', 'videos-exportados');
  const nombreExportado = edicion.salida.nombreExportado;
  const rutaExportada = path.join(carpetaExportados, nombreExportado);
  const rutaResumenSalida = path.join(entrada.rutas.carpetaProyecto, 'salida-simple.json');

  asegurarCarpeta(carpetaExportados);

  await exportarConFfmpeg({
    rutaEntrada: entrada.video.rutaOriginal,
    rutaSalida: rutaExportada,
    filtroVideo: edicion.render.filtroVideo,
    codecVideo: edicion.render.codecVideo,
    codecAudio: edicion.render.codecAudio,
    crf: edicion.render.crf,
    presetFfmpeg: edicion.render.presetFfmpeg
  });

  const salida = {
    ok: true,
    etapa: 'salida',
    tipo: 'exportar-simple',
    plataforma: edicion.plataforma,
    rutaExportada,
    nombreExportado,
    urlPublica: `/exports/${nombreExportado}`,
    formato: edicion.salida.formato,
    width: edicion.salida.width,
    height: edicion.salida.height,
    fps: edicion.salida.fps,
    analisisUsado: {
      orientacion: entendimiento?.analisis?.orientacion || null,
      duracionSegundos: entendimiento?.analisis?.duracionSegundos || null
    },
    creadoEn: new Date().toISOString()
  };

  await escribirJson(rutaResumenSalida, salida);

  return salida;
}
