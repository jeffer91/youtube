import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), 'Falta ' + ruta);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(ruta, claves) {
  const contenido = leer(ruta);
  for (const clave of claves) exigir(contenido.includes(clave), ruta + ' no contiene ' + clave);
}

function verificarVista() {
  contiene('app/pantallas/produccion.view.js', [
    'produccion-maestro-view',
    'data-produccion-maestro-root',
    'data-proceso-root="produccion-maestro"',
    'data-proceso-resumen="produccion-maestro"',
    'data-produccion-wizard-go="cargar"',
    'data-produccion-wizard-go="preview"',
    'data-produccion-wizard-go="comparacion"',
    'data-produccion-wizard-go="problemas"',
    'data-produccion-wizard-go="adaptacion"',
    'data-produccion-wizard-go="avanzado"',
    'data-produccion-wizard-panel="cargar"',
    'data-produccion-wizard-panel="preview"',
    'data-produccion-wizard-panel="comparacion"',
    'data-produccion-wizard-panel="problemas"',
    'data-produccion-wizard-panel="adaptacion"',
    'data-produccion-wizard-panel="avanzado"',
    'produccionMaestroProyectoId',
    'produccionMaestroCargarBtn',
    'produccionMaestroProcesarBtn',
    'produccionMaestroVideo',
    'produccionMaestroAntes',
    'produccionMaestroDespues',
    'produccionMaestroTimeline',
    'produccionMaestroAuditoria',
    'produccionMaestroAdaptarBtn',
    'production-legacy-hooks'
  ]);
}

function verificarControlador() {
  contiene('app/etapas-ui/produccion-maestro-ui.js', [
    'Bloque 11: Pantalla Producción maestro',
    'inicializarProduccionMaestroUI',
    'cargarProduccion',
    'procesarProduccion',
    'solicitarAdaptacion',
    '/produccion/procesar',
    '/adaptacion/procesar',
    'renderPreview',
    'renderComparacion',
    'renderTimeline',
    'renderAuditoria',
    'renderDetalle'
  ]);
}

function verificarWizardVisual() {
  contiene('app/etapas-ui/produccion-maestro-wizard-ui.js', [
    'inicializarProduccionMaestroWizardUI',
    'activarPasoProduccionMaestro',
    'irAPasoProduccionMaestro',
    'MAPA_PASO_PROCESO',
    'PASOS_PRODUCCION',
    'hayProduccionVisible',
    'comparacionDisponible',
    'listoParaAdaptacion',
    '../procesos-ui/proceso-visual.service.js',
    'data-produccion-wizard-panel',
    'data-produccion-wizard-go',
    'produccionMaestroCargarBtn',
    'produccionMaestroProcesarBtn',
    'produccionMaestroAdaptarBtn'
  ]);
}

function verificarBootstrapMenu() {
  contiene('app/navegacion/navegacion-bootstrap.js', [
    'inicializarProduccionMaestroUI',
    'inicializarProduccionMaestroWizardUI',
    'produccion-maestro.css',
    'produccionMaestroStyles'
  ]);
  contiene('app/navegacion/menu.config.js', [
    'Producción maestro',
    'Render maestro, auditoría, preview y antes/después'
  ]);
}

function verificarCss() {
  contiene('app/produccion-maestro.css', [
    'produccion-maestro-view',
    'produccion-maestro-flow',
    'produccion-maestro-step',
    'produccion-maestro-wizard',
    'produccion-maestro-wizard-panel',
    'produccion-maestro-toolbar',
    'produccion-maestro-kpis',
    'produccion-maestro-video',
    'produccion-maestro-compare',
    'produccion-maestro-timeline',
    'produccion-maestro-audit',
    'produccion-maestro-table',
    'produccion-maestro-footer'
  ]);
}

function verificarProcesosUi() {
  contiene('app/procesos-ui/procesos.config.js', [
    'produccion-maestro',
    'cargar-producir',
    'preview',
    'comparacion',
    'problemas',
    'adaptacion',
    'timeline-auditoria'
  ]);
}

function verificarDocumentacion() {
  contiene('docs/bloque-11-pantalla-produccion-maestro.md', [
    'Pantalla Producción maestro',
    'GET  /api/proyectos/:proyectoId/produccion',
    'POST /api/proyectos/:proyectoId/produccion/procesar',
    'siguiente_bloque: Biblioteca mejorada / recursos para producción'
  ]);
}

async function verificarImportaciones() {
  const vistas = await import('../app/pantallas/pantallas.conexion.js');
  exigir(typeof vistas.renderProduccionView === 'function', 'renderProduccionView no está exportada.');
  const ui = await import('../app/etapas-ui/produccion-maestro-ui.js');
  exigir(typeof ui.inicializarProduccionMaestroUI === 'function', 'inicializarProduccionMaestroUI no está exportada.');
  const wizard = await import('../app/etapas-ui/produccion-maestro-wizard-ui.js');
  exigir(typeof wizard.inicializarProduccionMaestroWizardUI === 'function', 'inicializarProduccionMaestroWizardUI no está exportada.');
  exigir(typeof wizard.activarPasoProduccionMaestro === 'function', 'activarPasoProduccionMaestro no está exportada.');
}

async function main() {
  verificarVista();
  verificarControlador();
  verificarWizardVisual();
  verificarBootstrapMenu();
  verificarCss();
  verificarProcesosUi();
  verificarDocumentacion();
  await verificarImportaciones();
  console.log('OK Producción maestro guiada: vista por pasos, controlador, wizard visual, navegación y CSS conectados.');
}

main().catch((error) => {
  console.error('ERROR Producción maestro guiada:', error.message);
  process.exit(1);
});
