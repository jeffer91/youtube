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
    'planProyectoId',
    'planCargarBtn',
    'planProcesarBtn',
    'planLectura',
    'planTimeline',
    'planElementos',
    'planProducirBtn'
  ]);
}

function verificarControlador() {
  contiene('app/etapas-ui/plan-edicion-ui.js', [
    'Bloque 9: Pantalla Plan de edición',
    'inicializarPlanEdicionUI',
    'cargarPlan',
    'procesarPlan',
    'producirPlaceholder',
    '/plan/procesar',
    '/produccion/procesar',
    'renderLectura',
    'renderFuente',
    'renderTimeline',
    'renderElementos'
  ]);
}

function verificarConexionNavegacion() {
  contiene('app/navegacion/menu.config.js', ['plan-edicion', 'Subtítulos, textos, recursos, efectos y timeline']);
  contiene('app/pantallas/pantallas.conexion.js', ['renderPlanEdicionView']);
  contiene('app/navegacion/navegacion.service.js', ['renderPlanEdicionView', 'plan-edicion']);
  contiene('app/navegacion/navegacion-bootstrap.js', ['inicializarPlanEdicionUI', 'plan-edicion.css', 'planEdicionStyles']);
}

function verificarCss() {
  contiene('app/plan-edicion.css', [
    'plan-view',
    'plan-toolbar',
    'plan-kpis',
    'plan-layout',
    'plan-panel',
    'plan-timeline',
    'plan-table',
    'plan-footer'
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
}

async function main() {
  verificarVista();
  verificarControlador();
  verificarConexionNavegacion();
  verificarCss();
  verificarDocumentacion();
  await verificarImportaciones();
  console.log('OK Bloque 9: pantalla Plan de edición conectada.');
}

main().catch((error) => {
  console.error('ERROR Bloque 9:', error.message);
  process.exit(1);
});
