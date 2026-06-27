import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const archivos = [
    'biblioteca/audio-limpio-simple.json',
    'audio/limpieza-simple/limpieza-audio.service.js',
    'comun/ffmpeg.js',
    'salida/exportar-simple/audio-exportacion-segura.service.js',
    'salida/exportar-simple/exportar.service.js',
    'editar/edicion-dinamica/sonidos/sonidos.config.js',
    'editar/edicion-dinamica/sonidos/mezclar-sonidos-edicion.service.js'
  ];
  const faltantes = archivos.filter((ruta) => !fs.existsSync(ruta));
  exigir(faltantes.length === 0, `Faltan archivos de audio seguro: ${faltantes.join(', ')}`);

  const preset = JSON.parse(leer('biblioteca/audio-limpio-simple.json'));
  exigir(preset.nombre === 'audio-voz-segura', 'El preset de audio no está en modo seguro.');
  exigir(preset.filtros.normalizacionDinamica.activo === false, 'La normalización dinámica agresiva debe estar apagada.');
  exigir(Number(preset.filtros.normalizacionFinal.integratedLoudness) <= -15, 'La normalización final debe ser conservadora.');

  const limpieza = leer('audio/limpieza-simple/limpieza-audio.service.js');
  exigir(limpieza.includes('modoAgresivo'), 'La limpieza no distingue modo agresivo/seguro.');
  exigir(limpieza.includes('aresample=async=1:first_pts=0'), 'La limpieza no protege sincronía con aresample.');

  const ffmpeg = leer('comun/ffmpeg.js');
  exigir(ffmpeg.includes('obtenerDuracionMediaFfmpeg'), 'FFmpeg no expone medición de duración.');
  exigir(ffmpeg.includes('combinarFiltroAudioSeguro'), 'FFmpeg no aplica filtro seguro de sincronía.');

  const audioSalida = leer('salida/exportar-simple/audio-exportacion-segura.service.js');
  exigir(audioSalida.includes('crearPlanAudioExportacionSeguro'), 'No existe plan de audio seguro para salida.');
  exigir(audioSalida.includes('preservarAudioOriginal'), 'El plan no respeta conservar audio original.');
  exigir(audioSalida.includes('compararDuraciones'), 'El plan no compara duración de video y audio.');

  const salida = leer('salida/exportar-simple/exportar.service.js');
  exigir(salida.includes('audio-exportacion-segura.json'), 'La salida no guarda auditoría de audio seguro.');
  exigir(salida.includes('crearPlanAudioExportacionSeguro'), 'La salida no usa el plan de audio seguro.');

  const sonidos = leer('editar/edicion-dinamica/sonidos/mezclar-sonidos-edicion.service.js');
  exigir(sonidos.includes('alimiter=limit=0.92'), 'La mezcla de sonidos no limita picos.');
  exigir(sonidos.includes('aresample=async=1:first_pts=0'), 'La mezcla de sonidos no protege sincronía.');

  console.log('OK audio seguro: preset conservador, sincronía, salida y sonidos protegidos.');
}

try {
  main();
} catch (error) {
  console.error('ERROR audio seguro:', error.message);
  process.exit(1);
}
