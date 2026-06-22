/*
  Nombre completo: crear-nombre-exportado.js
  Ruta o ubicación: youtube/editar/tiktok-cuadrado-centro/crear-nombre-exportado.js

  Función o funciones:
    - Crear un nombre seguro para el video exportado.
    - Evitar espacios, caracteres raros y nombres demasiado largos.
    - Diferenciar claramente los videos exportados con el preset tiktok-cuadrado-centro.
    - Mantener nombres compatibles con Windows, Electron, Express y FFmpeg.

  Con qué se conecta:
    - editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.config.js
    - editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js
    - salida/exportar-simple/exportar.service.js
*/

import path from 'path';
import { normalizarNombreArchivo } from '../../comun/archivos.js';

function obtenerFechaCorta(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

function limitarTexto(texto, maximo = 80) {
  const limpio = String(texto || '').trim();

  if (limpio.length <= maximo) {
    return limpio;
  }

  return limpio.slice(0, maximo).replace(/[-_\s]+$/g, '');
}

function obtenerNombreBase({ entrada, proyectoId }) {
  const nombreOriginal =
    entrada?.video?.nombreSeguro ||
    entrada?.video?.nombreOriginal ||
    entrada?.proyecto?.nombre ||
    proyectoId ||
    'video';

  const nombreSinExtension = path.basename(nombreOriginal, path.extname(nombreOriginal));
  const normalizado = normalizarNombreArchivo(nombreSinExtension);

  return limitarTexto(normalizado || 'video', 70);
}

export function crearNombreExportadoTikTokCuadradoCentro({ entrada, config } = {}) {
  const proyectoId = entrada?.proyecto?.id || 'sin-proyecto';
  const prefijo = config?.archivos?.prefijoExportado || 'tiktok-cuadrado-centro';
  const fecha = obtenerFechaCorta();
  const nombreBase = obtenerNombreBase({ entrada, proyectoId });

  const nombreFinal = `${nombreBase}-${prefijo}-${fecha}-${proyectoId}.mp4`;

  return normalizarNombreArchivo(nombreFinal);
}