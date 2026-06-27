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

function verificarServicio() {
  contiene('biblioteca/seleccionar-recursos-produccion.service.js', [
    'Bloque 12: Biblioteca mejorada / recursos para producción',
    'recomendarRecursosProduccion',
    'cargarResultadoEtapa',
    'PLAN_EDICION',
    'ENTENDIMIENTO',
    'puntuarRecurso',
    'crearNecesidadesDesdePlan',
    'biblioteca-sugerencias.json',
    'listoParaProduccion'
  ]);
}

function verificarConexionBackend() {
  contiene('biblioteca/biblioteca.conexion.js', ['recomendarRecursosProduccion']);
  contiene('server/rutas-modulares.service.js', [
    'recomendarRecursosProduccion',
    'biblioteca-produccion',
    '/api/proyectos/:proyectoId/biblioteca/recomendar'
  ]);
}

function verificarPantalla() {
  contiene('app/pantallas/biblioteca.view.js', [
    'library-recommend-panel',
    'libraryProjectIdInput',
    'libraryRecommendQuery',
    'libraryRecommendLimit',
    'recommend-project',
    'libraryRecommendList'
  ]);
  contiene('app/biblioteca-ui.js', [
    'recomendarRecursosProyecto',
    '/biblioteca/recomendar',
    'renderRecomendaciones',
    'libraryRecommendNeeds',
    'libraryRecommendSuggestions',
    'recommend-project'
  ]);
  contiene('app/biblioteca-ui.css', [
    'library-recommend-panel',
    'library-recommend-toolbar',
    'library-recommend-kpis',
    'library-recommend-card',
    'library-recommend-resources'
  ]);
}

function verificarDocumentacion() {
  contiene('docs/bloque-12-biblioteca-produccion.md', [
    'Biblioteca mejorada / recursos para producción',
    'POST /api/proyectos/:proyectoId/biblioteca/recomendar',
    '02-plan/biblioteca-sugerencias.json',
    'siguiente_bloque: Efectos visuales premium'
  ]);
}

async function verificarImportacionReal() {
  const modulo = await import('../biblioteca/seleccionar-recursos-produccion.service.js');
  exigir(typeof modulo.recomendarRecursosProduccion === 'function', 'recomendarRecursosProduccion no se exporta como función.');
}

async function main() {
  verificarServicio();
  verificarConexionBackend();
  verificarPantalla();
  verificarDocumentacion();
  await verificarImportacionReal();
  console.log('OK Bloque 12: biblioteca de producción conectada.');
}

main().catch((error) => {
  console.error('ERROR Bloque 12:', error.message);
  process.exit(1);
});
