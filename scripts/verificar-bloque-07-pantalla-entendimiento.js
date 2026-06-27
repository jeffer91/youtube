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
    'Bloque 7: Pantalla Entendimiento',
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

function verificarConexionNavegacion() {
  contiene('app/navegacion/menu.config.js', ['entendimiento', 'Transcripción, fotogramas y análisis global']);
  contiene('app/pantallas/pantallas.conexion.js', ['renderEntendimientoView']);
  contiene('app/navegacion/navegacion.service.js', ['renderEntendimientoView', 'entendimiento: renderEntendimientoView']);
  contiene('app/navegacion/navegacion-bootstrap.js', ['inicializarEntendimientoUI', 'entendimiento.css', 'entendimientoStyles']);
}

function verificarCss() {
  contiene('app/entendimiento.css', [
    'entendimiento-view',
    'entendimiento-toolbar',
    'entendimiento-kpis',
    'entendimiento-layout',
    'entendimiento-panel',
    'entendimiento-frames',
    'entendimiento-footer'
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
}

async function main() {
  verificarVista();
  verificarControlador();
  verificarConexionNavegacion();
  verificarCss();
  verificarDocumentacion();
  await verificarImportaciones();
  console.log('OK Bloque 7: pantalla Entendimiento conectada.');
}

main().catch((error) => {
  console.error('ERROR Bloque 7:', error.message);
  process.exit(1);
});
