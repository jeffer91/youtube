import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const archivos = [
    'transcripcion/servicios/transcribir-gemini.service.js',
    'transcripcion/servicios/transcribir-video.service.js',
    'transcripcion/servicios/generar-titulos-ganchos.service.js',
    'transcripcion/transcripcion.conexion.js',
    'transcripcion/reportes/crear-reporte-transcripcion.js',
    'motor/flujo-principal.js'
  ];
  const faltantes = archivos.filter((ruta) => !fs.existsSync(ruta));
  exigir(faltantes.length === 0, `Faltan archivos de transcripción/títulos/textos: ${faltantes.join(', ')}`);

  const gemini = leer('transcripcion/servicios/transcribir-gemini.service.js');
  exigir(gemini.includes('inlineData'), 'La transcripción Gemini no envía audio/video como inlineData.');
  exigir(gemini.includes('crearTranscripcionNormalizada'), 'La transcripción Gemini no normaliza segmentos.');
  exigir(gemini.includes('textoCompleto'), 'La transcripción Gemini no exige texto completo.');

  const transcribir = leer('transcripcion/servicios/transcribir-video.service.js');
  exigir(transcribir.includes('transcribirConGemini'), 'transcribir-video no conecta Gemini.');
  exigir(transcribir.includes('config.gemini.usarGemini'), 'transcribir-video no respeta usarGemini.');

  const titulos = leer('transcripcion/servicios/generar-titulos-ganchos.service.js');
  exigir(titulos.includes('titulo-principal'), 'No se genera título principal.');
  exigir(titulos.includes('gancho-visual'), 'No se genera gancho visual.');
  exigir(titulos.includes('titulos-ganchos.json'), 'No se guarda titulos-ganchos.json.');

  const conexion = leer('transcripcion/transcripcion.conexion.js');
  exigir(conexion.includes('generarTitulosYGanchos'), 'La conexión de transcripción no genera títulos/ganchos.');
  exigir(conexion.includes('combinarMomentosParaTextos'), 'Los títulos/ganchos no se combinan con textos flotantes.');
  exigir(conexion.includes('titulosGanchos'), 'El resultado no devuelve titulosGanchos.');

  const reporte = leer('transcripcion/reportes/crear-reporte-transcripcion.js');
  exigir(reporte.includes('titulosGanchos'), 'El reporte de transcripción no registra títulos/ganchos.');

  const flujo = leer('motor/flujo-principal.js');
  exigir(flujo.includes('entenderVideo(entrada, opciones)'), 'El flujo principal no pasa opciones al entendimiento.');
  exigir(flujo.includes('títulos/ganchos'), 'El mensaje final no reporta títulos/ganchos.');

  console.log('OK transcripción/títulos/textos: Gemini, subtítulos, títulos, ganchos y textos conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR transcripción/títulos/textos:', error.message);
  process.exit(1);
}
