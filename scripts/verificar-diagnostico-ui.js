/* Verificación Diagnóstico UI guiado por pasos. */

import fs from 'fs';
import { renderDiagnosticoView } from '../app/pantallas/diagnostico.view.js';
import { activarPasoDiagnostico, inicializarDiagnosticoWizardUI } from '../app/diagnostico-wizard-ui.js';
import { inicializarDiagnosticoFuerteUI } from '../app/diagnostico-fuerte-ui.js';
import { inicializarAuditoriaIntegralUI } from '../app/auditoria-integral-ui.js';

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
  const vista = renderDiagnosticoView();
  const wizard = leer('app/diagnostico-wizard-ui.js');
  const css = leer('app/diagnostico.css');
  const fuerte = leer('app/diagnostico-fuerte-ui.js');
  const auditoria = leer('app/auditoria-integral-ui.js');
  const bootstrap = leer('app/navegacion/navegacion-bootstrap.js');
  const procesos = leer('app/procesos-ui/procesos.config.js');

  exigir(typeof inicializarDiagnosticoWizardUI === 'function', 'inicializarDiagnosticoWizardUI no se exporta.');
  exigir(typeof activarPasoDiagnostico === 'function', 'activarPasoDiagnostico no se exporta.');
  exigir(typeof inicializarDiagnosticoFuerteUI === 'function', 'inicializarDiagnosticoFuerteUI no se exporta.');
  exigir(typeof inicializarAuditoriaIntegralUI === 'function', 'inicializarAuditoriaIntegralUI no se exporta.');

  contiene(vista, [
    'data-diagnostico-root',
    'data-proceso-root="diagnostico"',
    'data-proceso-resumen="diagnostico"',
    'data-diagnostico-wizard-go="rapido"',
    'data-diagnostico-wizard-go="fuerte"',
    'data-diagnostico-wizard-go="auditoria"',
    'data-diagnostico-wizard-go="final"',
    'data-diagnostico-wizard-go="detalle"',
    'data-diagnostico-wizard-panel="rapido"',
    'data-diagnostico-wizard-panel="fuerte"',
    'data-diagnostico-wizard-panel="auditoria"',
    'data-diagnostico-wizard-panel="final"',
    'data-diagnostico-wizard-panel="detalle"',
    'data-diagnostic-action="strong"',
    'data-diagnostic-action="audit"',
    'data-diagnostic-action="final-redisenio"',
    'strongDiagnosticStatus',
    'strongDiagnosticResult',
    'integralAuditStatus',
    'integralAuditResult',
    'finalRedesignDiagnosticStatus',
    'finalRedesignDiagnosticResult'
  ], 'Vista diagnóstico');

  contiene(wizard, [
    './procesos-ui/proceso-visual.service.js',
    './diagnostico-fuerte-ui.js',
    './auditoria-integral-ui.js',
    'PASOS_DIAGNOSTICO',
    'MAPA_PASO_PROCESO',
    'activarPasoDiagnostico',
    'ejecutarAccionDiagnostico',
    'data-diagnostico-wizard-go',
    'data-diagnostic-action',
    'autovideojeff.diagnosticoPaso'
  ], 'Wizard diagnóstico');

  contiene(fuerte, ['ejecutarDiagnosticoFuerteUI', 'ejecutarDiagnosticoFinalRedisenioUI', '/api/autovideo/diagnostico/fuerte', '/api/autovideo/diagnostico/final-redisenio'], 'Diagnóstico fuerte UI');
  contiene(auditoria, ['ejecutarAuditoriaIntegralUI', '/api/autovideo/diagnostico/auditoria-integral'], 'Auditoría integral UI');

  contiene(css, [
    'diagnostic-page',
    'diagnostic-flow',
    'diagnostic-step',
    'diagnostic-wizard',
    'diagnostic-wizard-panel',
    'diagnostic-start-grid',
    'diagnostic-detail-grid'
  ], 'CSS diagnóstico');

  contiene(bootstrap, ['inicializarDiagnosticoWizardUI', 'diagnostico.css', 'diagnosticoStyles'], 'Bootstrap navegación');
  contiene(procesos, ['diagnostico', 'rapido', 'fuerte', 'auditoria', 'final', 'detalle-tecnico'], 'Procesos UI');

  console.log('OK diagnóstico UI guiado: fuerte, auditoría, final, wizard, CSS y navegación conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR diagnóstico UI:', error.message);
  process.exit(1);
}
