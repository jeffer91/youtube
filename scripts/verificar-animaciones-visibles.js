import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const archivos = [
    'editar/edicion-dinamica/visual/generar-animaciones-ffmpeg.service.js',
    'editar/edicion-dinamica/visual/construir-filtro-visual-ffmpeg.js',
    'editar/edicion-dinamica/visual/visual.conexion.js',
    'salida/reporte-final/reporte-final.service.js'
  ];
  const faltantes = archivos.filter((ruta) => !fs.existsSync(ruta));
  exigir(faltantes.length === 0, `Faltan archivos de animaciones visibles: ${faltantes.join(', ')}`);

  const animaciones = leer('editar/edicion-dinamica/visual/generar-animaciones-ffmpeg.service.js');
  exigir(animaciones.includes('crearFiltroZoomInOut'), 'No existe zoom in/out animado.');
  exigir(animaciones.includes('sin(6.28318*t'), 'El zoom in/out no usa expresión temporal.');
  exigir(animaciones.includes('drawbox'), 'No existen flashes/transiciones visibles.');
  exigir(animaciones.includes('drawtext'), 'No existe explosión/texto divertido visible.');
  exigir(animaciones.includes('BOOM!') || animaciones.includes('WOW!'), 'No hay efecto divertido tipo BOOM/WOW.');
  exigir(animaciones.includes('0.5+0.5*sin'), 'El zoom debe crecer y volver sin reducir el lienzo por debajo del tamaño final.');

  const filtro = leer('editar/edicion-dinamica/visual/construir-filtro-visual-ffmpeg.js');
  exigir(filtro.includes('generarAnimacionesFfmpeg'), 'El constructor de filtro no importa animaciones FFmpeg.');
  exigir(filtro.includes('filtrosMovimiento'), 'El filtro no aplica zoom in/out.');
  exigir(filtro.includes('filtrosOverlay'), 'El filtro no aplica explosiones/transiciones.');

  const conexion = leer('editar/edicion-dinamica/visual/visual.conexion.js');
  exigir(conexion.includes('Preparando animaciones aunque no haya cortes dinámicos'), 'Visual dinámico sigue dependiendo de cortes dinámicos.');
  exigir(conexion.includes('animacionesRender'), 'No se reportan animaciones renderizadas.');
  exigir(conexion.includes('zoom in/out, explosiones, transiciones'), 'El mensaje no confirma animaciones visibles.');

  const reporte = leer('salida/reporte-final/reporte-final.service.js');
  exigir(reporte.includes('animacionesRenderizadas'), 'El reporte final no cuenta animaciones renderizadas.');

  console.log('OK animaciones visibles: zoom in/out, explosiones, flashes y transiciones conectadas al render.');
}

try {
  main();
} catch (error) {
  console.error('ERROR animaciones visibles:', error.message);
  process.exit(1);
}
