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
  contiene('app/pantallas/adaptacion.view.js', [
    'renderAdaptacionView',
    'data-adaptacion-root',
    'data-proceso-root="adaptacion"',
    'data-proceso-resumen="adaptacion"',
    'data-adaptacion-wizard-go="cargar"',
    'data-adaptacion-wizard-go="plataformas"',
    'data-adaptacion-wizard-go="adaptar"',
    'data-adaptacion-wizard-go="versiones"',
    'data-adaptacion-wizard-go="resultado"',
    'data-adaptacion-wizard-go="avanzado"',
    'data-adaptacion-wizard-panel="cargar"',
    'data-adaptacion-wizard-panel="plataformas"',
    'data-adaptacion-wizard-panel="adaptar"',
    'data-adaptacion-wizard-panel="versiones"',
    'data-adaptacion-wizard-panel="resultado"',
    'data-adaptacion-wizard-panel="avanzado"',
    'adaptacionProyectoId',
    'adaptacionCargarBtn',
    'adaptacionProcesarBtn',
    'adaptacionPlataforma',
    'adaptacionBaseVideo',
    'adaptacionPlataformas',
    'adaptacionExportaciones',
    'adaptacionResultadoBtn'
  ]);
}

function verificarControlador() {
  contiene('app/etapas-ui/adaptacion-ui.js', [
    'Bloque 16: Pantalla Adaptación',
    'inicializarAdaptacionUI',
    'cargarAdaptacion',
    'procesarAdaptacion',
    'solicitarResultadoFinal',
    '/adaptacion/procesar',
    '/resultado/exportar',
    'renderPlataformas',
    'renderExportaciones',
    'obtenerPlataformasSeleccionadas'
  ]);
}

function verificarWizardVisual() {
  contiene('app/etapas-ui/adaptacion-wizard-ui.js', [
    'inicializarAdaptacionWizardUI',
    'activarPasoAdaptacion',
    'irAPasoAdaptacion',
    'MAPA_PASO_PROCESO',
    'PASOS_ADAPTACION',
    'hayPlataformasSeleccionadas',
    'hayAdaptacionVisible',
    'listoParaResultado',
    '../procesos-ui/proceso-visual.service.js',
    'data-adaptacion-wizard-panel',
    'data-adaptacion-wizard-go',
    'adaptacionCargarBtn',
    'adaptacionProcesarBtn',
    'adaptacionResultadoBtn'
  ]);
}

function verificarConexionNavegacion() {
  contiene('app/navegacion/menu.config.js', ['adaptacion', 'Versiones finales para TikTok, Reels, Shorts y YouTube']);
  contiene('app/pantallas/pantallas.conexion.js', ['renderAdaptacionView']);
  contiene('app/navegacion/navegacion.service.js', ['renderAdaptacionView', 'adaptacion: renderAdaptacionView']);
  contiene('app/navegacion/navegacion-bootstrap.js', ['inicializarAdaptacionUI', 'inicializarAdaptacionWizardUI', 'adaptacion.css', 'adaptacionStyles']);
}

function verificarCss() {
  contiene('app/adaptacion.css', [
    'adaptacion-view',
    'adaptacion-flow',
    'adaptacion-step',
    'adaptacion-wizard',
    'adaptacion-wizard-panel',
    'adaptacion-toolbar',
    'adaptacion-options',
    'adaptacion-kpis',
    'adaptacion-layout',
    'adaptacion-platforms',
    'adaptacion-table',
    'adaptacion-footer'
  ]);
}

function verificarProcesosUi() {
  contiene('app/procesos-ui/procesos.config.js', [
    'adaptacion',
    'cargar-proyecto',
    'plataformas',
    'adaptar',
    'revisar-versiones',
    'resultado-final',
    'opciones-avanzadas'
  ]);
}

function verificarDocumentacion() {
  contiene('docs/bloque-16-pantalla-adaptacion.md', [
    'Pantalla Adaptación',
    'GET  /api/proyectos/:proyectoId/adaptacion',
    'POST /api/proyectos/:proyectoId/adaptacion/procesar',
    'siguiente_bloque: Resultado final'
  ]);
}

async function verificarImportaciones() {
  const vistas = await import('../app/pantallas/pantallas.conexion.js');
  exigir(typeof vistas.renderAdaptacionView === 'function', 'renderAdaptacionView no está exportada.');
  const ui = await import('../app/etapas-ui/adaptacion-ui.js');
  exigir(typeof ui.inicializarAdaptacionUI === 'function', 'inicializarAdaptacionUI no está exportada.');
  const wizard = await import('../app/etapas-ui/adaptacion-wizard-ui.js');
  exigir(typeof wizard.inicializarAdaptacionWizardUI === 'function', 'inicializarAdaptacionWizardUI no está exportada.');
  exigir(typeof wizard.activarPasoAdaptacion === 'function', 'activarPasoAdaptacion no está exportada.');
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
  console.log('OK Adaptación guiada: vista por pasos, controlador, wizard visual, navegación y CSS conectados.');
}

main().catch((error) => {
  console.error('ERROR Adaptación guiada:', error.message);
  process.exit(1);
});
