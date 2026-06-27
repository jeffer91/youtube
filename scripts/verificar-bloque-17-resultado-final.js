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

function verificarServicioResultado() {
  contiene('etapas/05-resultado/procesar-resultado-final.service.js', [
    'Bloque 17: Resultado final',
    'procesarResultadoFinalProyectoEtapa',
    'crearResumenFinal',
    'crearChecklist',
    'crearPublicacionSugerida',
    'resultado-final.html',
    'manifest-publicacion.json',
    'FINALIZADO',
    'listoParaPublicar'
  ]);
}

function verificarRutasEtapas() {
  contiene('server/rutas-etapas.service.js', [
    'procesarResultadoFinalProyectoEtapa',
    "tipo === 'resultado'",
    'Resultado final real conectado desde el Bloque 17',
    'pendienteImplementacion: false',
    '/api/proyectos/:proyectoId/resultado/exportar',
    '/api/proyectos/:proyectoId/resultado'
  ]);
}

function verificarPantalla() {
  contiene('app/pantallas/resultado.view.js', [
    'data-resultado-final-root',
    'resultadoFinalProyectoId',
    'resultadoFinalCargarBtn',
    'resultadoFinalGenerarBtn',
    'resultadoFinalVideo',
    'resultadoFinalChecklist',
    'resultadoFinalVersiones',
    'resultadoFinalContent'
  ]);
  contiene('app/resultado-final-ui.js', [
    'Bloque 17: Resultado final',
    'renderizarResultadoFinalUI',
    'cargarResultadoFinal',
    'generarResultadoFinal',
    '/resultado/exportar',
    'renderChecklist',
    'renderVersiones',
    'renderReporte'
  ]);
  contiene('app/resultado-final.css', [
    'result-final-page',
    'result-final-toolbar',
    'result-final-kpis',
    'result-final-layout',
    'result-final-checklist',
    'result-final-platforms',
    'result-final-report-card'
  ]);
}

function verificarMenuBootstrap() {
  contiene('app/navegacion/menu.config.js', ['Resultado final', 'Paquete final, checklist y entregables de publicación']);
  contiene('app/navegacion/navegacion-bootstrap.js', ['resultado-final.css', 'resultadoFinalStyles', 'inicializarResultadoFinalUI']);
}

function verificarDocumentacion() {
  contiene('docs/bloque-17-resultado-final.md', [
    'Resultado final',
    'POST /api/proyectos/:proyectoId/resultado/exportar',
    '05-resultado/reporte-final.json',
    'resultado-final.html',
    'siguiente_bloque: Diagnóstico final y verificadores'
  ]);
}

async function verificarImportacionReal() {
  const modulo = await import('../etapas/05-resultado/procesar-resultado-final.service.js');
  exigir(typeof modulo.procesarResultadoFinalProyectoEtapa === 'function', 'procesarResultadoFinalProyectoEtapa no se exporta como función.');
  const ui = await import('../app/resultado-final-ui.js');
  exigir(typeof ui.renderizarResultadoFinalUI === 'function', 'renderizarResultadoFinalUI no se exporta como función.');
}

async function main() {
  verificarServicioResultado();
  verificarRutasEtapas();
  verificarPantalla();
  verificarMenuBootstrap();
  verificarDocumentacion();
  await verificarImportacionReal();
  console.log('OK Bloque 17: resultado final conectado.');
}

main().catch((error) => {
  console.error('ERROR Bloque 17:', error.message);
  process.exit(1);
});
