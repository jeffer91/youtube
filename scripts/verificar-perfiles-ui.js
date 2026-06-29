/* Verificación Perfiles UI guiado por pasos. */

import fs from 'fs';
import { PERFILES, renderPerfilesView } from '../app/pantallas/perfiles.view.js';
import { activarPasoPerfiles, inicializarPerfilesUI } from '../app/perfiles-ui.js';

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
  const vista = renderPerfilesView();
  const ui = leer('app/perfiles-ui.js');
  const css = leer('app/perfiles.css');
  const bootstrap = leer('app/navegacion/navegacion-bootstrap.js');
  const procesos = leer('app/procesos-ui/procesos.config.js');

  exigir(Array.isArray(PERFILES) && PERFILES.length >= 7, 'No existen perfiles suficientes.');
  exigir(typeof inicializarPerfilesUI === 'function', 'inicializarPerfilesUI no se exporta.');
  exigir(typeof activarPasoPerfiles === 'function', 'activarPasoPerfiles no se exporta.');

  contiene(vista, [
    'data-perfiles-root',
    'data-proceso-root="perfiles"',
    'data-proceso-resumen="perfiles"',
    'data-perfiles-wizard-go="elegir"',
    'data-perfiles-wizard-go="ritmo"',
    'data-perfiles-wizard-go="textos"',
    'data-perfiles-wizard-go="visual"',
    'data-perfiles-wizard-go="uso"',
    'data-perfiles-wizard-panel="elegir"',
    'data-perfiles-wizard-panel="ritmo"',
    'data-perfiles-wizard-panel="textos"',
    'data-perfiles-wizard-panel="visual"',
    'data-perfiles-wizard-panel="uso"',
    'profileRitmoDetail',
    'profileTextosDetail',
    'profileVisualDetail',
    'profileUsoDetail',
    'data-profile-select="11-contra-11"'
  ], 'Vista perfiles');

  contiene(ui, [
    './pantallas/perfiles.view.js',
    './procesos-ui/proceso-visual.service.js',
    'PASOS_PERFILES',
    'MAPA_PASO_PROCESO',
    'activarPasoPerfiles',
    'seleccionarPerfil',
    'actualizarDetalles',
    'data-perfiles-wizard-go',
    'data-profile-select',
    'autovideojeff.perfilActivo'
  ], 'UI perfiles');

  contiene(css, [
    'profiles-page',
    'profiles-flow',
    'profiles-step',
    'profiles-wizard',
    'profiles-wizard-panel',
    'profiles-grid',
    'profile-style-card',
    'profiles-selected-card'
  ], 'CSS perfiles');

  contiene(bootstrap, ['inicializarPerfilesUI', 'perfiles.css', 'perfilesStyles'], 'Bootstrap navegación');
  contiene(procesos, ['perfiles', 'elegir', 'ritmo', 'textos', 'visual', 'uso'], 'Procesos UI');

  console.log('OK perfiles UI guiado: perfiles, pasos, wizard, CSS y navegación conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR perfiles UI:', error.message);
  process.exit(1);
}
