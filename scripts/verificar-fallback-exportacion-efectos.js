import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const salida = leer('salida/exportar-simple/exportar.service.js');
  const ffmpeg = leer('comun/ffmpeg.js');

  exigir(salida.includes('exportarConFallbackVisual'), 'Falta exportarConFallbackVisual.');
  exigir(salida.includes('filtroVideoBase'), 'La salida no busca filtroVideoBase para fallback.');
  exigir(salida.includes('fallbackVisualUsado'), 'La salida no registra fallbackVisualUsado.');
  exigir(salida.includes('errorFiltroPrincipal'), 'La salida no registra errorFiltroPrincipal.');
  exigir(ffmpeg.includes('limpiarSalidaAnterior'), 'FFmpeg no limpia salida anterior antes de exportar.');
  exigir(ffmpeg.includes('construirErrorFfmpeg'), 'FFmpeg no adjunta diagnóstico stdout/stderr.');

  console.log('OK fallback exportacion efectos: fallback visual y diagnostico FFmpeg conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR fallback exportacion efectos:', error.message);
  process.exit(1);
}
