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

function verificarConexionNavegacion() {
  contiene('app/navegacion/menu.config.js', ['adaptacion', 'Versiones finales para TikTok, Reels, Shorts y YouTube']);
  contiene('app/pantallas/pantallas.conexion.js', ['renderAdaptacionView']);
  contiene('app/navegacion/navegacion.service.js', ['renderAdaptacionView', 'adaptacion: renderAdaptacionView']);
  contiene('app/navegacion/navegacion-bootstrap.js', ['inicializarAdaptacionUI', 'adaptacion.css', 'adaptacionStyles']);
}

function verificarCss() {
  contiene('app/adaptacion.css', [
    'adaptacion-view',
    'adaptacion-toolbar',
    'adaptacion-options',
    'adaptacion-kpis',
    'adaptacion-layout',
    'adaptacion-platforms',
    'adaptacion-table',
    'adaptacion-footer'
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
}

async function main() {
  verificarVista();
  verificarControlador();
  verificarConexionNavegacion();
  verificarCss();
  verificarDocumentacion();
  await verificarImportaciones();
  console.log('OK Bloque 16: pantalla Adaptación conectada.');
}

main().catch((error) => {
  console.error('ERROR Bloque 16:', error.message);
  process.exit(1);
});
