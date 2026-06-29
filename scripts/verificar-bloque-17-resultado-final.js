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
    'data-proceso-root="resultado-final"',
    'data-proceso-resumen="resultado-final"',
    'data-resultado-wizard-go="cargar"',
    'data-resultado-wizard-go="maestro"',
    'data-resultado-wizard-go="versiones"',
    'data-resultado-wizard-go="checklist"',
    'data-resultado-wizard-go="reporte"',
    'data-resultado-wizard-panel="cargar"',
    'data-resultado-wizard-panel="maestro"',
    'data-resultado-wizard-panel="versiones"',
    'data-resultado-wizard-panel="checklist"',
    'data-resultado-wizard-panel="reporte"',
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
  contiene('app/resultado-final-wizard-ui.js', [
    'inicializarResultadoFinalWizardUI',
    'activarPasoResultadoFinal',
    'irAPasoResultadoFinal',
    'MAPA_PASO_PROCESO',
    'PASOS_RESULTADO',
    'hayResultadoVisible',
    'tieneVideoMaestro',
    './procesos-ui/proceso-visual.service.js',
    'data-resultado-wizard-panel',
    'data-resultado-wizard-go',
    'resultadoFinalCargarBtn',
    'resultadoFinalGenerarBtn'
  ]);
  contiene('app/resultado-final.css', [
    'result-final-page',
    'result-final-flow',
    'result-final-step',
    'result-final-wizard',
    'result-final-wizard-panel',
    'result-final-toolbar',
    'result-final-kpis',
    'result-final-checklist',
    'result-final-platforms',
    'result-final-report-card'
  ]);
}

function verificarMenuBootstrap() {
  contiene('app/navegacion/menu.config.js', ['Resultado final', 'Paquete final, checklist y entregables de publicación']);
  contiene('app/navegacion/navegacion-bootstrap.js', ['resultado-final.css', 'resultadoFinalStyles', 'inicializarResultadoFinalUI', 'inicializarResultadoFinalWizardUI']);
}

function verificarProcesosUi() {
  contiene('app/procesos-ui/procesos.config.js', [
    'resultado-final',
    'cargar-generar',
    'maestro',
    'versiones',
    'checklist',
    'reporte'
  ]);
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
  const wizard = await import('../app/resultado-final-wizard-ui.js');
  exigir(typeof wizard.inicializarResultadoFinalWizardUI === 'function', 'inicializarResultadoFinalWizardUI no se exporta como función.');
  exigir(typeof wizard.activarPasoResultadoFinal === 'function', 'activarPasoResultadoFinal no se exporta como función.');
}

async function main() {
  verificarServicioResultado();
  verificarRutasEtapas();
  verificarPantalla();
  verificarMenuBootstrap();
  verificarProcesosUi();
  verificarDocumentacion();
  await verificarImportacionReal();
  console.log('OK Resultado final guiado: vista por pasos, controlador, wizard visual, navegación y CSS conectados.');
}

main().catch((error) => {
  console.error('ERROR Resultado final guiado:', error.message);
  process.exit(1);
});
