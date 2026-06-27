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

function verificarBootstrapMenu() {
  contiene('app/navegacion/navegacion-bootstrap.js', [
    'inicializarProduccionMaestroUI',
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
    'produccion-maestro-toolbar',
    'produccion-maestro-kpis',
    'produccion-maestro-video',
    'produccion-maestro-compare',
    'produccion-maestro-timeline',
    'produccion-maestro-audit',
    'produccion-maestro-table'
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
}

async function main() {
  verificarVista();
  verificarControlador();
  verificarBootstrapMenu();
  verificarCss();
  verificarDocumentacion();
  await verificarImportaciones();
  console.log('OK Bloque 11: pantalla Producción maestro conectada.');
}

main().catch((error) => {
  console.error('ERROR Bloque 11:', error.message);
  process.exit(1);
});
