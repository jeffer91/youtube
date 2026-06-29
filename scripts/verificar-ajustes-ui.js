/* Verificación Ajustes UI guiado por pasos. */

import fs from 'fs';
import { renderAjustesView } from '../app/pantallas/ajustes.view.js';
import { activarPasoAjustes, inicializarAjustesWizardUI } from '../app/ajustes-wizard-ui.js';
import { inicializarAjustesGeminiUI } from '../app/ajustes-gemini-ui.js';

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
  const vista = renderAjustesView();
  const wizard = leer('app/ajustes-wizard-ui.js');
  const gemini = leer('app/ajustes-gemini-ui.js');
  const css = leer('app/ajustes.css');
  const bootstrap = leer('app/navegacion/navegacion-bootstrap.js');
  const procesos = leer('app/procesos-ui/procesos.config.js');

  exigir(typeof inicializarAjustesWizardUI === 'function', 'inicializarAjustesWizardUI no se exporta.');
  exigir(typeof activarPasoAjustes === 'function', 'activarPasoAjustes no se exporta.');
  exigir(typeof inicializarAjustesGeminiUI === 'function', 'inicializarAjustesGeminiUI no se exporta.');

  contiene(vista, [
    'data-ajustes-root',
    'data-proceso-root="ajustes"',
    'data-proceso-resumen="ajustes"',
    'data-ajustes-wizard-go="activar"',
    'data-ajustes-wizard-go="clave"',
    'data-ajustes-wizard-go="modelo"',
    'data-ajustes-wizard-go="parametros"',
    'data-ajustes-wizard-go="probar"',
    'data-ajustes-wizard-go="guardar"',
    'data-ajustes-wizard-go="avanzado"',
    'data-ajustes-wizard-panel="activar"',
    'data-ajustes-wizard-panel="clave"',
    'data-ajustes-wizard-panel="modelo"',
    'data-ajustes-wizard-panel="parametros"',
    'data-ajustes-wizard-panel="probar"',
    'data-ajustes-wizard-panel="guardar"',
    'data-ajustes-wizard-panel="avanzado"',
    'ajustesUseGemini',
    'ajustesUseFallbackGemini',
    'ajustesGeminiCredencial',
    'ajustesGeminiModelo',
    'ajustesGeminiTemperatura',
    'ajustesGeminiTimeoutMs',
    'ajustesTestGemini',
    'ajustesSaveGemini',
    'ajustesClearGemini',
    'ajustesGeminiGuia'
  ], 'Vista ajustes');

  contiene(wizard, [
    './procesos-ui/proceso-visual.service.js',
    'PASOS_AJUSTES',
    'MAPA_PASO_PROCESO',
    'activarPasoAjustes',
    'irAPasoAjustes',
    'usaGemini',
    'tieneClave',
    'parametrosValidos',
    'data-ajustes-wizard-go',
    'data-ajustes-wizard-panel',
    'autovideojeff.ajustesPaso'
  ], 'Wizard ajustes');

  contiene(gemini, [
    'inicializarAjustesGeminiUI',
    'leerConfigGeminiLocal',
    'guardarConfigGeminiLocal',
    'limpiarClaveGeminiLocal',
    '/api/autovideo/gemini/probar'
  ], 'UI Gemini ajustes');

  contiene(css, [
    'ajustes-gemini-page',
    'ajustes-flow',
    'ajustes-step',
    'ajustes-wizard',
    'ajustes-wizard-panel',
    'ajustes-test-box',
    'ajustes-save-actions'
  ], 'CSS ajustes');

  contiene(bootstrap, ['inicializarAjustesGeminiUI', 'inicializarAjustesWizardUI', 'ajustes.css', 'ajustesStyles'], 'Bootstrap navegación');
  contiene(procesos, ['ajustes', 'activar', 'clave', 'modelo', 'parametros', 'probar', 'guardar', 'guia-fallback'], 'Procesos UI');

  console.log('OK ajustes UI guiado: Gemini, pasos, wizard, CSS y navegación conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR ajustes UI:', error.message);
  process.exit(1);
}
