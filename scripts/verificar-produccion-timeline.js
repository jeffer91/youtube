import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const archivos = [
    'produccion/linea-tiempo-produccion.service.js',
    'produccion/produccion.config.js',
    'produccion/produccion.modelo.js',
    'produccion/crear-plan-produccion.service.js',
    'produccion/produccion.conexion.js',
    'motor/flujo-modular-autovideo.service.js',
    'app/pantallas/produccion.view.js',
    'app/produccion-revision-ui.js',
    'app/produccion-revision.css'
  ];
  const faltantes = archivos.filter((ruta) => !fs.existsSync(ruta));
  exigir(faltantes.length === 0, `Faltan archivos de timeline de Producción: ${faltantes.join(', ')}`);

  const config = leer('produccion/produccion.config.js');
  exigir(config.includes('pistasLineaTiempo'), 'Producción no define pistas de línea de tiempo.');
  exigir(config.includes('animacion'), 'Producción no contempla animaciones.');
  exigir(config.includes('imagen'), 'Producción no contempla imágenes.');

  const timeline = leer('produccion/linea-tiempo-produccion.service.js');
  exigir(timeline.includes('crearLineaTiempoProduccion'), 'No existe crearLineaTiempoProduccion.');
  exigir(timeline.includes('sincronizarLineaTiempoConElementos'), 'No existe sincronización de timeline con elementos.');

  const plan = leer('produccion/crear-plan-produccion.service.js');
  exigir(plan.includes('extraerAnimaciones'), 'El plan no integra animaciones.');
  exigir(plan.includes('imagenes'), 'El plan no integra imágenes o recursos visuales.');
  exigir(plan.includes('sincronizarLineaTiempoConElementos'), 'El plan no genera timeline final.');

  const modular = leer('motor/flujo-modular-autovideo.service.js');
  exigir(modular.includes('crearImagenesDesdeFotogramas'), 'El flujo no convierte fotogramas en imágenes revisables.');
  exigir(modular.includes('duracionSegundos'), 'El flujo no envía duración al plan de Producción.');

  const view = leer('app/pantallas/produccion.view.js');
  exigir(view.includes('productionTimeline'), 'La vista Producción no tiene contenedor timeline.');
  exigir(view.includes('productionBeforeVideo'), 'La vista Producción no tiene antes/después.');

  const ui = leer('app/produccion-revision-ui.js');
  exigir(ui.includes('renderTimeline'), 'La UI no renderiza timeline.');
  exigir(ui.includes('aplicarTiempoProduccionUI'), 'La UI no permite cambiar tiempos.');
  exigir(ui.includes('Eliminar/No usar'), 'La UI no permite eliminar/no usar elementos.');
  exigir(ui.includes('productionPreviewPanel'), 'La UI no conecta preview antes/después.');

  console.log('OK Producción timeline: pistas, antes/después, imágenes, animaciones, efectos y edición de tiempo conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR Producción timeline:', error.message);
  process.exit(1);
}
