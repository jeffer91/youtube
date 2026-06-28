/*
  Verificacion UI: Biblioteca proyecto orden inteligente
  Revisa que la pantalla tenga pasos, estados bloqueados/activos y controles que se habilitan segun proyecto, archivo y recursos.
*/

import fs from 'fs';
import { renderBibliotecaProyectoView } from '../app/pantallas/biblioteca-proyecto.view.js';
import { renderRecursosBibliotecaProyecto } from '../app/biblioteca-proyecto-ui.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const vista = renderBibliotecaProyectoView();
  const ui = leer('app/biblioteca-proyecto-ui.js');
  const css = leer('app/biblioteca-proyecto.css');

  [
    'projectLibraryStepProject',
    'projectLibraryStepUpload',
    'projectLibraryStepReview',
    'projectLibraryStepPlan',
    'projectLibraryActionHint',
    'projectLibraryFormFieldset',
    'projectLibrarySaveBtn',
    'projectLibraryFooterHint',
    'data-smart-state',
    'data-smart-section="upload"',
    'data-smart-section="review"',
    'data-smart-section="plan"'
  ].forEach((clave) => exigir(vista.includes(clave), `Vista no contiene ${clave}`));

  [
    'estadoInteligente',
    'actualizarVistaInteligente',
    'actualizarPaso',
    'aplicarHabilitada',
    'archivoSeleccionado',
    'totalRecursos',
    'projectLibraryFormFieldset',
    'projectLibrarySaveBtn',
    'projectLibraryFooterHint',
    'lista-plan',
    'clasificando',
    'Primero guarda al menos un recurso temporal'
  ].forEach((clave) => exigir(ui.includes(clave), `UI no contiene ${clave}`));

  [
    '.project-library-flow',
    '.project-library-step.is-active',
    '.project-library-step.is-done',
    '.project-library-step.is-locked',
    '.project-library-upload-card.is-disabled',
    '.project-library-form.is-disabled',
    '[data-smart-state="lista-plan"]'
  ].forEach((clave) => exigir(css.includes(clave), `CSS no contiene ${clave}`));

  const tarjeta = renderRecursosBibliotecaProyecto([
    { id: 'r1', nombre: 'Logo temporal inteligente', tipo: 'imagen', categoria: 'logo', formato: 'imagen', estadoTecnico: 'listo', usoSugerido: 'marca visual del proyecto', etiquetas: ['temporal'] }
  ]);
  exigir(tarjeta.includes('Logo temporal inteligente'), 'Render de recurso temporal no funciona.');
  exigir(tarjeta.includes('marca visual del proyecto'), 'Render no conserva uso sugerido.');

  console.log('OK biblioteca proyecto orden inteligente: pasos, bloqueo, activacion y render verificados');
}

try {
  main();
} catch (error) {
  console.error('ERROR biblioteca proyecto orden inteligente:', error.message);
  process.exit(1);
}
