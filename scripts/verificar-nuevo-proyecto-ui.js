/* Verificacion Opcion A bloque 2: formulario y logica de Nuevo proyecto. */

import fs from 'fs';

function main() {
  const index = fs.readFileSync('app/index.html', 'utf-8');
  const app = fs.readFileSync('app/app.js', 'utf-8');
  const css = fs.readFileSync('app/styles.css', 'utf-8');

  const idsRequeridos = [
    'nuevoProyectoProcessor',
    'videoForm',
    'videoInput',
    'profileSelect',
    'editModeSelect',
    'exportMultiplatform',
    'processButton',
    'progressArea',
    'messageBox',
    'resultPanel',
    'resultPlatformsPanel',
    'beforeAfterPanel'
  ];

  const faltantes = idsRequeridos.filter((id) => !index.includes(`id="${id}"`));
  if (faltantes.length) throw new Error(`Faltan IDs en Nuevo proyecto: ${faltantes.join(', ')}`);
  if (!index.includes('data-screen-panel="nuevo-proyecto"')) throw new Error('El procesador no pertenece al panel Nuevo proyecto.');
  if (!index.includes('data-platform-option')) throw new Error('No existen opciones de plataformas.');
  if (!css.includes('body[data-pantalla-activa="nuevo-proyecto"]')) throw new Error('CSS no muestra procesador solo en Nuevo proyecto.');
  if (!app.includes("const PANTALLA_PROCESADOR = 'nuevo-proyecto'")) throw new Error('app.js no define pantalla del procesador.');
  if (!app.includes('esPantallaProcesadorActiva')) throw new Error('app.js no valida pantalla activa.');
  if (!app.includes('aplicarEstadoControlesProcesador')) throw new Error('app.js no sincroniza controles por pantalla.');
  if (!app.includes('autovideo:navegacion')) throw new Error('app.js no escucha cambios de pantalla.');
  if (!app.includes('if (!esPantallaProcesadorActiva()) return;')) throw new Error('app.js no bloquea submit fuera de Nuevo proyecto.');

  console.log('OK Nuevo proyecto UI: formulario aislado y logica conectada');
}

try {
  main();
} catch (error) {
  console.error('ERROR Nuevo proyecto UI:', error.message);
  process.exit(1);
}
