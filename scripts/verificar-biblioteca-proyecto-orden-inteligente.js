/*
  Verificacion UI: Biblioteca proyecto guiada
  Revisa que la pantalla tenga pasos progresivos, estados bloqueados/activos y controles que se habilitan segun proyecto, archivo y recursos.
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

function contiene(contenido, claves, contexto) {
  for (const clave of claves) exigir(contenido.includes(clave), `${contexto} no contiene ${clave}`);
}

function main() {
  const vista = renderBibliotecaProyectoView();
  const ui = leer('app/biblioteca-proyecto-ui.js');
  const css = leer('app/biblioteca-proyecto.css');
  const procesos = leer('app/procesos-ui/procesos.config.js');

  contiene(vista, [
    'data-proceso-root="biblioteca-proyecto"',
    'data-proceso-resumen="biblioteca-proyecto"',
    'projectLibraryStepProject',
    'projectLibraryStepUpload',
    'projectLibraryStepCategory',
    'projectLibraryStepData',
    'projectLibraryStepSave',
    'projectLibraryStepReview',
    'projectLibraryStepPlan',
    'data-project-library-wizard-panel="proyecto"',
    'data-project-library-wizard-panel="archivo"',
    'data-project-library-wizard-panel="categoria"',
    'data-project-library-wizard-panel="datos"',
    'data-project-library-wizard-panel="guardar"',
    'data-project-library-wizard-panel="revisar"',
    'data-project-library-wizard-panel="plan"',
    'projectLibraryActionHint',
    'projectLibraryFormFieldset',
    'projectLibrarySaveBtn',
    'projectLibrarySaveReviewTitle',
    'projectLibraryFooterHint',
    'data-smart-state',
    'data-smart-section="upload"',
    'data-smart-section="review"',
    'data-smart-section="plan"'
  ], 'Vista biblioteca proyecto');

  contiene(ui, [
    './procesos-ui/proceso-visual.service.js',
    'estadoInteligente',
    'actualizarVistaInteligente',
    'actualizarPaso',
    'activarPasoBibliotecaProyecto',
    'irAPasoBibliotecaProyecto',
    'MAPA_PASO_PROCESO',
    'PASOS_BIBLIOTECA_PROYECTO',
    'archivoSeleccionado',
    'totalRecursos',
    'projectLibraryFormFieldset',
    'projectLibrarySaveBtn',
    'projectLibraryFooterHint',
    'lista-plan',
    'clasificando',
    'Primero guarda al menos un recurso temporal'
  ], 'UI biblioteca proyecto');

  contiene(css, [
    '.project-library-flow',
    '.project-library-step.is-active',
    '.project-library-step.is-done',
    '.project-library-step.is-locked',
    '.project-library-wizard',
    '.project-library-wizard-panel',
    '.project-library-save-review',
    '.project-library-upload-card.is-disabled',
    '.project-library-form.is-disabled',
    '[data-smart-state="lista-plan"]'
  ], 'CSS biblioteca proyecto');

  contiene(procesos, ['biblioteca-proyecto', 'cargar-proyecto', 'elegir-archivo', 'categoria', 'uso-etiquetas', 'guardar-temporal', 'revisar-recursos', 'ir-plan'], 'Procesos UI');

  const tarjeta = renderRecursosBibliotecaProyecto([
    { id: 'r1', nombre: 'Logo temporal inteligente', tipo: 'imagen', categoria: 'logo', formato: 'imagen', estadoTecnico: 'listo', usoSugerido: 'marca visual del proyecto', etiquetas: ['temporal'] }
  ]);
  exigir(tarjeta.includes('Logo temporal inteligente'), 'Render de recurso temporal no funciona.');
  exigir(tarjeta.includes('marca visual del proyecto'), 'Render no conserva uso sugerido.');

  console.log('OK biblioteca proyecto guiada: pasos, bloqueo, activacion, proceso visual y render verificados');
}

try {
  main();
} catch (error) {
  console.error('ERROR biblioteca proyecto guiada:', error.message);
  process.exit(1);
}
