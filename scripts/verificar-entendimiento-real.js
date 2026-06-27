import fs from 'fs';

const ARCHIVOS = Object.freeze([
  'entender/entender.conexion.js',
  'entender/analisis-simple/analisis.service.js',
  'entender/transcripcion-simple/transcripcion.service.js',
  'entender/fotogramas/fotogramas.service.js',
  'entender/fotogramas/index.js',
  'entender/analisis-video/analisis-video.service.js',
  'entender/analisis-video/index.js',
  'entender/reporte-entendimiento/reporte-entendimiento.service.js',
  'entender/reporte-entendimiento/index.js'
]);

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const faltantes = ARCHIVOS.filter((ruta) => !fs.existsSync(ruta));
  exigir(faltantes.length === 0, `Faltan archivos de entendimiento real: ${faltantes.join(', ')}`);

  const conexion = leer('entender/entender.conexion.js');
  exigir(conexion.includes('extraerFotogramasClave'), 'La conexión de entender no extrae fotogramas.');
  exigir(conexion.includes('analizarVideoEditorial'), 'La conexión de entender no genera análisis editorial.');
  exigir(conexion.includes('crearReporteEntendimiento'), 'La conexión de entender no genera reporte único.');

  const fotogramas = leer('entender/fotogramas/fotogramas.service.js');
  exigir(fotogramas.includes('ffmpeg'), 'La extracción de fotogramas no usa FFmpeg.');
  exigir(fotogramas.includes('fotogramas-clave.json'), 'No se guarda fotogramas-clave.json.');

  const editorial = leer('entender/analisis-video/analisis-video.service.js');
  exigir(editorial.includes('momentosClave'), 'El análisis editorial no genera momentos clave.');
  exigir(editorial.includes('necesidades'), 'El análisis editorial no genera necesidades de edición.');

  const reporte = leer('entender/reporte-entendimiento/reporte-entendimiento.service.js');
  exigir(reporte.includes('reporte-entendimiento.json'), 'No se guarda reporte-entendimiento.json.');
  exigir(reporte.includes('Transcripción'), 'El reporte no controla estado de transcripción.');
  exigir(reporte.includes('Fotogramas'), 'El reporte no controla estado de fotogramas.');

  console.log('OK entendimiento real: análisis técnico, transcripción, fotogramas, análisis editorial y reporte conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR entendimiento real:', error.message);
  process.exit(1);
}
