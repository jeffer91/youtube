import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const ruta = 'app/styles.css';
  exigir(fs.existsSync(ruta), 'No existe app/styles.css.');
  const css = leer(ruta);
  exigir(css.includes('@import url(\'./final-correcciones.css\')'), 'styles.css debe importar final-correcciones.css.');
  exigir(css.includes('.aj-home-actions button'), 'Falta estilo para botones del Inicio.');
  exigir(css.includes('.aj-home-status'), 'Falta estilo para estado del Inicio.');
  exigir(css.includes('.primary-button'), 'Falta estilo para botones principales.');
  exigir(css.includes('.progress-area'), 'Falta estilo para área de progreso.');
  exigir(css.includes('.result-panel'), 'Falta estilo para panel de resultado.');
  exigir(css.length > 5000, 'styles.css está demasiado corto; puede haberse truncado otra vez.');
  console.log('OK estilo principal: Inicio, botones, progreso y resultado tienen CSS completo.');
}

try {
  main();
} catch (error) {
  console.error('ERROR estilo principal:', error.message);
  process.exit(1);
}
