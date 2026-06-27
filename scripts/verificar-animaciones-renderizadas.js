import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const archivos = [
    'editar/animaciones/animaciones-render.service.js',
    'editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js',
    'editar/tiktok-simple/tiktok.service.js',
    'salida/reporte-final/reporte-final.service.js'
  ];
  const faltantes = archivos.filter((ruta) => !fs.existsSync(ruta));
  exigir(faltantes.length === 0, `Faltan archivos de animaciones renderizadas: ${faltantes.join(', ')}`);

  const motor = leer('editar/animaciones/animaciones-render.service.js');
  exigir(motor.includes('zoom_in'), 'El motor no genera zoom in.');
  exigir(motor.includes('zoom_out'), 'El motor no genera zoom out.');
  exigir(motor.includes('explosion_pop'), 'El motor no genera efecto de explosión/pop.');
  exigir(motor.includes('barrido_transicion'), 'El motor no genera transiciones tipo barrido.');
  exigir(motor.includes('corte_flash'), 'El motor no genera cortes/transiciones con flash.');
  exigir(motor.includes('scale=w='), 'El motor no aplica zoom real con scale.');
  exigir(motor.includes('crop='), 'El motor no recompone el cuadro después del zoom.');

  const cuadrado = leer('editar/tiktok-cuadrado-centro/tiktok-cuadrado-centro.service.js');
  exigir(cuadrado.includes('aplicarAnimacionesRender'), 'El modo cuadrado no importa animaciones renderizadas.');
  exigir(cuadrado.includes('aplicarAnimacionesAVisual'), 'El modo cuadrado no aplica animaciones al filtro final.');
  exigir(cuadrado.includes('animacionesRenderAplicadas'), 'El modo cuadrado no audita animaciones renderizadas.');

  const simple = leer('editar/tiktok-simple/tiktok.service.js');
  exigir(simple.includes('aplicarAnimacionesRender'), 'El modo simple no importa animaciones renderizadas.');
  exigir(simple.includes('animacionesRender'), 'El modo simple no guarda animaciones renderizadas.');

  const reporte = leer('salida/reporte-final/reporte-final.service.js');
  exigir(reporte.includes('animacionesRenderizadas'), 'El reporte final no cuenta animaciones renderizadas.');
  exigir(reporte.includes('render-ffmpeg'), 'El reporte final no marca animaciones de render FFmpeg.');

  console.log('OK animaciones renderizadas: zoom in/out, explosión, cortes flash, barridos y reporte conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR animaciones renderizadas:', error.message);
  process.exit(1);
}
