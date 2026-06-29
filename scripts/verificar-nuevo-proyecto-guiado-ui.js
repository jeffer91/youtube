/* Verificación Nuevo Proyecto UI guiado por pasos. */

import fs from 'fs';
import { activarPasoNuevoProyecto, inicializarNuevoProyectoUI } from '../app/nuevo-proyecto-ui.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(contenido, claves, contexto) {
  for (const clave of claves) exigir(contenido.includes(clave), `${contexto} no contiene ${clave}`);
}

function main() {
  const index = leer('app/index.html');
  const ui = leer('app/nuevo-proyecto-ui.js');
  const css = leer('app/nuevo-proyecto-limpio.css');
  const bootstrap = leer('app/navegacion/navegacion-bootstrap.js');
  const procesos = leer('app/procesos-ui/procesos.config.js');

  exigir(typeof inicializarNuevoProyectoUI === 'function', 'inicializarNuevoProyectoUI no se exporta.');
  exigir(typeof activarPasoNuevoProyecto === 'function', 'activarPasoNuevoProyecto no se exporta.');

  contiene(index, [
    'data-nuevo-proyecto-root',
    'data-proceso-root="nuevo-proyecto"',
    'data-proceso-resumen="nuevo-proyecto"',
    'data-nuevo-wizard-go="nombre"',
    'data-nuevo-wizard-go="subir-video"',
    'data-nuevo-wizard-go="procesar"',
    'data-nuevo-wizard-go="tecnico"',
    'data-nuevo-project-zone="nombre"',
    'data-nuevo-project-zone="subir-video"',
    'data-nuevo-project-zone="procesar"',
    'data-nuevo-project-zone="tecnico"',
    'projectNameInput',
    'videoInput',
    'fileName',
    'processButton',
    'progressArea',
    'messageBox',
    'legacy-options-hidden'
  ], 'Index nuevo proyecto');

  contiene(ui, [
    './procesos-ui/proceso-visual.service.js',
    'PASOS_NUEVO_PROYECTO',
    'MAPA_PASO_PROCESO',
    'activarPasoNuevoProyecto',
    'irAPasoNuevoProyecto',
    'tieneNombre',
    'tieneVideo',
    'data-nuevo-wizard-go',
    'data-nuevo-project-zone',
    'autovideojeff.nuevoProyectoPaso'
  ], 'UI nuevo proyecto');

  contiene(css, [
    'clean-project-flow',
    'clean-project-step',
    'clean-project-message',
    'clean-project-upload-zone',
    'clean-project-process-zone',
    'is-current-zone',
    'legacy-options-hidden'
  ], 'CSS nuevo proyecto');

  contiene(bootstrap, ['inicializarNuevoProyectoUI'], 'Bootstrap navegación');
  contiene(procesos, ['nuevo-proyecto', 'nombre', 'subir-video', 'procesar-entendimiento', 'opciones-tecnicas'], 'Procesos UI');

  console.log('OK nuevo proyecto guiado: nombre, video, procesar, técnico, CSS y navegación conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR nuevo proyecto guiado:', error.message);
  process.exit(1);
}
