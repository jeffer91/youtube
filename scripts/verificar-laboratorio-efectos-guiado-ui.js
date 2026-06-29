/* Verificación Laboratorio de efectos UI guiado por pasos. */

import fs from 'fs';
import { renderLaboratorioEfectosView } from '../app/pantallas/laboratorio-efectos.view.js';
import { activarPasoLaboratorioEfectos, inicializarLaboratorioEfectosUI } from '../app/laboratorio-efectos-ui.js';

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
  const vista = renderLaboratorioEfectosView();
  const ui = leer('app/laboratorio-efectos-ui.js');
  const cssGuiado = leer('app/laboratorio-efectos-guiado.css');
  const cssBase = leer('app/laboratorio-efectos.css');
  const navegacion = leer('app/navegacion/navegacion.service.js');
  const procesos = leer('app/procesos-ui/procesos.config.js');

  exigir(typeof inicializarLaboratorioEfectosUI === 'function', 'inicializarLaboratorioEfectosUI no se exporta.');
  exigir(typeof activarPasoLaboratorioEfectos === 'function', 'activarPasoLaboratorioEfectos no se exporta.');

  contiene(vista, [
    'data-lab-efectos-root',
    'data-proceso-root="laboratorio-efectos"',
    'data-proceso-resumen="laboratorio-efectos"',
    'data-lab-wizard-go="video"',
    'data-lab-wizard-go="catalogo"',
    'data-lab-wizard-go="efecto"',
    'data-lab-wizard-go="esperado"',
    'data-lab-wizard-go="probar"',
    'data-lab-wizard-go="comparar"',
    'data-lab-wizard-panel="video"',
    'data-lab-wizard-panel="catalogo"',
    'data-lab-wizard-panel="efecto"',
    'data-lab-wizard-panel="esperado"',
    'data-lab-wizard-panel="probar"',
    'data-lab-wizard-panel="comparar"',
    'labEfectosVideoInput',
    'labEfectosAcordeones',
    'labEfectosResumenSeleccion',
    'labEfectosQueDebeSalir',
    'labEfectosProbarBtn',
    'labEfectosResultadoPanel',
    'labEfectosResultadoVideo'
  ], 'Vista laboratorio efectos');

  contiene(ui, [
    './procesos-ui/proceso-visual.service.js',
    'PASOS_LAB',
    'MAPA_PASO_PROCESO',
    'activarPasoLaboratorioEfectos',
    'irAPasoLaboratorioEfectos',
    'tieneVideoEntrada',
    'tieneResultado',
    'data-lab-wizard-go',
    'data-lab-wizard-panel',
    'laboratorio-efectos-guiado.css',
    'autovideojeff.laboratorioEfectosPaso'
  ], 'UI laboratorio efectos');

  contiene(cssGuiado, [
    'lab-effects-flow',
    'lab-effects-flow-step',
    'lab-effects-wizard-form',
    'lab-effects-wizard-panel',
    'lab-effects-actions-row'
  ], 'CSS guiado laboratorio efectos');

  contiene(cssBase, ['lab-effects-screen', 'lab-effects-card', 'lab-effects-accordion-list', 'lab-effects-compare'], 'CSS base laboratorio efectos');
  contiene(navegacion, ['inicializarLaboratorioEfectosUI', 'laboratorio-efectos'], 'Navegación laboratorio efectos');
  contiene(procesos, ['laboratorio-efectos', 'video-corto', 'categoria-efecto', 'efecto', 'esperado', 'probar', 'comparar'], 'Procesos UI');

  console.log('OK laboratorio efectos guiado: video, catálogo, efecto, esperado, probar, comparar, CSS y navegación conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR laboratorio efectos guiado:', error.message);
  process.exit(1);
}
