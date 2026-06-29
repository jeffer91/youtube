import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(ruta, claves) {
  const contenido = leer(ruta);
  for (const clave of claves) exigir(contenido.includes(clave), `${ruta} no contiene ${clave}`);
}

function verificarVista() {
  contiene('app/pantallas/entendimiento.view.js', [
    'renderEntendimientoView',
    'data-entendimiento-root',
    'data-proceso-root="entendimiento"',
    'data-proceso-resumen="entendimiento"',
    'data-entendimiento-wizard-go="cargar"',
    'data-entendimiento-wizard-go="procesar"',
    'data-entendimiento-wizard-go="transcripcion"',
    'data-entendimiento-wizard-go="fotogramas"',
    'data-entendimiento-wizard-go="analisis"',
    'data-entendimiento-wizard-go="biblioteca"',
    'data-entendimiento-wizard-go="avanzado"',
    'data-entendimiento-wizard-panel="cargar"',
    'data-entendimiento-wizard-panel="procesar"',
    'data-entendimiento-wizard-panel="transcripcion"',
    'data-entendimiento-wizard-panel="fotogramas"',
    'data-entendimiento-wizard-panel="analisis"',
    'data-entendimiento-wizard-panel="biblioteca"',
    'data-entendimiento-wizard-panel="avanzado"',
    'entendimientoProyectoId',
    'entendimientoCargarBtn',
    'entendimientoProcesarBtn',
    'entendimientoTranscripcion',
    'entendimientoFrames',
    'entendimientoGlobal',
    'entendimientoCrearPlanBtn'
  ]);
}

function verificarControlador() {
  contiene('app/etapas-ui/entendimiento-ui.js', [
    'inicializarEntendimientoUI',
    'cargarEntendimiento',
    'procesarEntendimiento',
    'crearPlanPlaceholder',
    '/api/proyectos/',
    '/entendimiento/procesar',
    '/plan/procesar',
    'renderTranscripcion',
    'renderFrames',
    'renderGlobal',
    'renderNecesidades'
  ]);
}

function verificarWizardVisual() {
  contiene('app/etapas-ui/entendimiento-wizard-ui.js', [
    'inicializarEntendimientoWizardUI',
    'activarPasoEntendimiento',
    'irAPasoEntendimiento',
    'MAPA_PASO_PROCESO',
    'PASOS_ENTENDIMIENTO',
    'hayResultadoVisible',
    'estaListoParaBiblioteca',
    './procesos-ui/proceso-visual.service.js',
    'data-entendimiento-wizard-panel',
    'data-entendimiento-wizard-go',
    'entendimientoProcesarBtn'
  ]);
}

function verificarConexionNavegacion() {
  contiene('app/navegacion/menu.config.js', ['entendimiento', 'Transcripción, fotogramas y análisis global']);
  contiene('app/pantallas/pantallas.conexion.js', ['renderEntendimientoView']);
  contiene('app/navegacion/navegacion.service.js', ['renderEntendimientoView', 'entendimiento: renderEntendimientoView']);
  contiene('app/navegacion/navegacion-bootstrap.js', ['inicializarEntendimientoUI', 'inicializarEntendimientoWizardUI', 'entendimiento.css', 'entendimientoStyles']);
}

function verificarCss() {
  contiene('app/entendimiento.css', [
    'entendimiento-view',
    'entendimiento-flow',
    'entendimiento-step',
    'entendimiento-wizard',
    'entendimiento-wizard-panel',
    'entendimiento-toolbar',
    'entendimiento-kpis',
    'entendimiento-frames',
    'entendimiento-footer'
  ]);
}

function verificarProcesosUi() {
  contiene('app/procesos-ui/procesos.config.js', [
    'entendimiento',
    'cargar-proyecto',
    'procesar',
    'transcripcion',
    'fotogramas',
    'analisis-global',
    'pasar-biblioteca',
    'motores'
  ]);
}

function verificarDocumentacion() {
  contiene('docs/bloque-07-pantalla-entendimiento.md', [
    'Pantalla Entendimiento',
    'GET  /api/proyectos/:proyectoId/entendimiento',
    'POST /api/proyectos/:proyectoId/entendimiento/procesar',
    'siguiente_bloque: Plan de edición backend'
  ]);
}

async function verificarImportaciones() {
  const vistas = await import('../app/pantallas/pantallas.conexion.js');
  exigir(typeof vistas.renderEntendimientoView === 'function', 'renderEntendimientoView no está exportada.');
  const ui = await import('../app/etapas-ui/entendimiento-ui.js');
  exigir(typeof ui.inicializarEntendimientoUI === 'function', 'inicializarEntendimientoUI no está exportada.');
  const wizard = await import('../app/etapas-ui/entendimiento-wizard-ui.js');
  exigir(typeof wizard.inicializarEntendimientoWizardUI === 'function', 'inicializarEntendimientoWizardUI no está exportada.');
  exigir(typeof wizard.activarPasoEntendimiento === 'function', 'activarPasoEntendimiento no está exportada.');
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
  console.log('OK Entendimiento guiado: vista por pasos, controlador, wizard visual, navegación y CSS conectados.');
}

main().catch((error) => {
  console.error('ERROR Entendimiento guiado:', error.message);
  process.exit(1);
});
