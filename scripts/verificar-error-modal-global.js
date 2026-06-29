/* Verificación: modal global de errores con archivo responsable. */

import fs from 'fs';
import { normalizarErrorParaModal, mostrarModalErrorEdicion, inicializarModalErrorEdicion } from '../app/error-modal.js';

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
  const modal = leer('app/error-modal.js');
  const css = leer('app/error-modal.css');
  const index = leer('app/index.html');
  const app = leer('app/app.js');
  const packageJson = leer('package.json');

  exigir(typeof normalizarErrorParaModal === 'function', 'normalizarErrorParaModal no se exporta.');
  exigir(typeof mostrarModalErrorEdicion === 'function', 'mostrarModalErrorEdicion no se exporta.');
  exigir(typeof inicializarModalErrorEdicion === 'function', 'inicializarModalErrorEdicion no se exporta.');

  const errorNormalizado = normalizarErrorParaModal(new Error('Falla de prueba'), {
    ruta: '/api/laboratorio-efectos/probar',
    etapa: 'laboratorio-efectos'
  });
  exigir(errorNormalizado.archivo === 'server/rutas-laboratorio-efectos.service.js', 'No infiere archivo responsable por ruta.');
  exigir(errorNormalizado.detalle.includes('Falla de prueba'), 'No conserva detalle del error.');

  contiene(modal, [
    'RUTAS_RESPONSABLES',
    'normalizarErrorParaModal',
    'obtenerArchivoResponsable',
    'mostrarModalErrorEdicion',
    'instalarCapturaFetchGlobal',
    'window.addEventListener(\'error\'',
    'window.addEventListener(\'unhandledrejection\'',
    'window.addEventListener(\'autovideo:error\'',
    'window.AutoVideoJeffErrores',
    'errorModalTechnicalDetail',
    'copyErrorButton',
    'Archivo responsable:'
  ], 'error-modal.js');

  contiene(css, [
    'modal-backdrop',
    'error-modal-card',
    'error-detail-box',
    'error-modal-technical-detail',
    'error-copy-button'
  ], 'error-modal.css');

  contiene(index, [
    'errorModal',
    'errorModalTitle',
    'errorModalStage',
    'errorModalDetail',
    'errorModalFile',
    'errorModalRecommendation',
    'closeErrorModal'
  ], 'index.html');

  contiene(app, ['inicializarModalErrorEdicion', 'mostrarModalErrorEdicion'], 'app.js');
  contiene(packageJson, ['check:error-modal-global'], 'package.json');

  console.log('OK modal global de errores: captura fetch, runtime, promesas y archivo responsable.');
}

try {
  main();
} catch (error) {
  console.error('ERROR modal global de errores:', error.message);
  process.exit(1);
}
