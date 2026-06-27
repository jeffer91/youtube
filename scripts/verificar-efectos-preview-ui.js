import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const ui = leer('app/efectos-ui.js');
  const app = leer('app/app.js');
  const css = leer('app/configuracion-proyecto.css');
  const rutas = leer('server/rutas-modulares.service.js');

  exigir(ui.includes('previewEffectsButton'), 'Falta boton de previsualizacion de efectos.');
  exigir(ui.includes('effectsPreviewResult'), 'Falta panel de resultado de previsualizacion.');
  exigir(ui.includes('/api/autovideo/efectos/previsualizar'), 'La UI no llama a la ruta de previsualizacion.');
  exigir(ui.includes('construirPayloadPrevisualizacion'), 'La UI no construye payload de previsualizacion.');
  exigir(app.includes('inicializarEfectosUI({ crearUrlApi })'), 'app.js no entrega crearUrlApi a efectos-ui.');
  exigir(css.includes('effects-preview-result'), 'Faltan estilos para resultado de preview.');
  exigir(rutas.includes('/api/autovideo/efectos/previsualizar'), 'El servidor no expone la ruta de preview de efectos.');

  console.log('OK UI preview efectos: boton, panel, API y estilos conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR UI preview efectos:', error.message);
  process.exit(1);
}
