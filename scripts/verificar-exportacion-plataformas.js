/*
  Verificacion Bloque 1: modulo exportacion por plataformas.
*/

import { prepararExportaciones, validarExportaciones, obtenerIdsPlataformas } from '../exportacion/exportacion.conexion.js';

function main() {
  const ids = obtenerIdsPlataformas();
  const exportaciones = prepararExportaciones({
    id: 'proyecto-prueba',
    plataformas: ['tiktok', 'reels', 'shorts', 'youtube', 'instagram'],
    rutas: { exportaciones: 'salida/proyectos/proyecto-prueba/exportaciones' }
  }, {
    videoOrigen: 'salida/proyectos/proyecto-prueba/produccion/video-editado.mp4'
  });

  const validacion = validarExportaciones(exportaciones);
  if (ids.length < 6) throw new Error('Faltan plataformas base de exportacion.');
  if (!validacion.ok) throw new Error(validacion.errores.join(' | '));
  if (!exportaciones.some((item) => item.formato === '9:16')) throw new Error('No se preparo exportacion vertical.');
  if (!exportaciones.some((item) => item.formato === '16:9')) throw new Error('No se preparo exportacion horizontal.');
  if (!exportaciones.some((item) => item.formato === '1:1')) throw new Error('No se preparo exportacion cuadrada.');

  console.log('OK exportacion:', exportaciones.map((item) => `${item.plataforma}:${item.formato}`).join(', '));
}

try {
  main();
} catch (error) {
  console.error('ERROR exportacion:', error.message);
  process.exit(1);
}
