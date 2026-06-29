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
  contiene('app/pantallas/plan-edicion.view.js', [
    'renderPlanEdicionView',
    'data-plan-root',
    'data-proceso-root="plan-edicion"',
    'data-proceso-resumen="plan-edicion"',
    'data-plan-wizard-go="cargar"',
    'data-plan-wizard-go="resumen"',
    'data-plan-wizard-go="elementos"',
    'data-plan-wizard-go="timeline"',
    'data-plan-wizard-go="aprobar"',
    'data-plan-wizard-go="producir"',
    'data-plan-wizard-go="avanzado"',
    'data-plan-wizard-panel="cargar"',
    'data-plan-wizard-panel="resumen"',
    'data-plan-wizard-panel="elementos"',
    'data-plan-wizard-panel="timeline"',
    'data-plan-wizard-panel="aprobar"',
    'data-plan-wizard-panel="producir"',
    'data-plan-wizard-panel="avanzado"',
    'planProyectoId',
    'planCargarBtn',
    'planProcesarBtn',
    'planAprobarBtn',
    'planLectura',
    'planFuente',
    'planContextoDetalle',
    'planPartesDetalle',
    'planEditorDetalle',
    'planTimeline',
    'planElementos',
    'planProducirBtn'
  ]);
}

function verificarControlador() {
  contiene('app/etapas-ui/plan-edicion-ui.js', [
    'Pantalla Plan de edición',
    'inicializarPlanEdicionUI',
    'cargarPlan',
    'procesarPlan',
    'aprobarPlan',
    'producirVideoDesdePlan',
    '/plan/procesar',
    '/produccion/procesar',
    'renderLectura',
    'renderFuente',
    'renderContexto',
    'renderPartes',
    'renderEditor',
    'renderTimeline',
    'renderElementos'
  ]);
}

function verificarWizardVisual() {
  contiene('app/etapas-ui/plan-edicion-wizard-ui.js', [
    'inicializarPlanEdicionWizardUI',
    'activarPasoPlanEdicion',
    'irAPasoPlanEdicion',
    'MAPA_PASO_PROCESO',
    'PASOS_PLAN',
    'hayPlanVisible',
    'planAprobado',
    'puedeProducir',
    '../procesos-ui/proceso-visual.service.js',
    'data-plan-wizard-panel',
    'data-plan-wizard-go',
    'planCargarBtn',
    'planProcesarBtn',
    'planAprobarBtn',
    'planProducirBtn'
  ]);
}

function verificarConexionNavegacion() {
  contiene('app/navegacion/menu.config.js', ['plan-edicion', 'Subtítulos, textos, recursos, efectos y timeline']);
  contiene('app/pantallas/pantallas.conexion.js', ['renderPlanEdicionView']);
  contiene('app/navegacion/navegacion.service.js', ['renderPlanEdicionView', 'plan-edicion']);
  contiene('app/navegacion/navegacion-bootstrap.js', ['inicializarPlanEdicionUI', 'inicializarPlanEdicionWizardUI', 'plan-edicion.css', 'planEdicionStyles']);
}

function verificarCss() {
  contiene('app/plan-edicion.css', [
    'plan-view',
    'plan-flow',
    'plan-step',
    'plan-wizard',
    'plan-wizard-panel',
    'plan-toolbar',
    'plan-kpis',
    'plan-advanced-grid',
    'plan-timeline',
    'plan-table',
    'plan-footer'
  ]);
}

function verificarProcesosUi() {
  contiene('app/procesos-ui/procesos.config.js', [
    'plan-edicion',
    'cargar-crear',
    'resumen',
    'elementos',
    'timeline',
    'aprobar',
    'producir',
    'detalles-tecnicos'
  ]);
}

function verificarDocumentacion() {
  contiene('docs/bloque-09-pantalla-plan-edicion.md', [
    'Pantalla Plan de edición',
    'GET  /api/proyectos/:proyectoId/plan',
    'POST /api/proyectos/:proyectoId/plan/procesar',
    'siguiente_bloque: Producción maestro backend'
  ]);
}

async function verificarImportaciones() {
  const vistas = await import('../app/pantallas/pantallas.conexion.js');
  exigir(typeof vistas.renderPlanEdicionView === 'function', 'renderPlanEdicionView no está exportada.');
  const ui = await import('../app/etapas-ui/plan-edicion-ui.js');
  exigir(typeof ui.inicializarPlanEdicionUI === 'function', 'inicializarPlanEdicionUI no está exportada.');
  const wizard = await import('../app/etapas-ui/plan-edicion-wizard-ui.js');
  exigir(typeof wizard.inicializarPlanEdicionWizardUI === 'function', 'inicializarPlanEdicionWizardUI no está exportada.');
  exigir(typeof wizard.activarPasoPlanEdicion === 'function', 'activarPasoPlanEdicion no está exportada.');
}

async function main() {
  verificarVista();
  verificarControlador();
  verificarWizardVisual();
  verificarConexionNavegacion();
  verificarCss();
  verificarProcesosUi();
  verificarDocumentacion();
  await verificarImportaciones();
  console.log('OK Plan de edición guiado: vista por pasos, controlador, wizard visual, navegación y CSS conectados.');
}

main().catch((error) => {
  console.error('ERROR Plan de edición guiado:', error.message);
  process.exit(1);
});
