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

function verificarServicioFinal() {
  contiene('diagnostico/diagnostico-final-redisenio.service.js', [
    'Bloque 18: Diagnóstico final y verificadores',
    'crearDiagnosticoFinalRedisenio',
    'ARCHIVOS_FLUJO_FINAL',
    'ARCHIVOS_UI_FINAL',
    'RUTAS_API_ETAPAS',
    'SCRIPTS_BLOQUES',
    'DOCS_BLOQUES',
    'crearMatrizEtapas',
    'diagnostico-final-redisenio.json'
  ]);
}

function verificarRutasFinales() {
  contiene('server/rutas-modulares.service.js', [
    'crearDiagnosticoFinalRedisenio',
    'diagnostico-final-redisenio',
    '/api/autovideo/diagnostico/final-redisenio'
  ]);
  contiene('server/rutas-etapas.service.js', [
    'procesarResultadoFinalProyectoEtapa',
    '/api/proyectos/:proyectoId/entendimiento/procesar',
    '/api/proyectos/:proyectoId/plan/procesar',
    '/api/proyectos/:proyectoId/produccion/procesar',
    '/api/proyectos/:proyectoId/adaptacion/procesar',
    '/api/proyectos/:proyectoId/resultado/exportar'
  ]);
}

function verificarPantallaDiagnostico() {
  contiene('app/pantallas/diagnostico.view.js', [
    'Diagnóstico final rediseño',
    'data-diagnostic-action="final-redisenio"',
    'finalRedesignDiagnosticStatus',
    'finalRedesignDiagnosticResult'
  ]);
  contiene('app/diagnostico-fuerte-ui.js', [
    'ejecutarDiagnosticoFinalRedisenioUI',
    'renderDiagnosticoFinalRedisenio',
    '/api/autovideo/diagnostico/final-redisenio',
    'diagnostic-final-matrix',
    'diagnostic-final-revisions'
  ]);
  contiene('app/diagnostico-fuerte.css', [
    'strong-diagnostic-button.is-final',
    'diagnostic-final-matrix',
    'diagnostic-final-revisions'
  ]);
}

function verificarPackageYDocs() {
  contiene('package.json', [
    'check:bloque18-autovideo',
    'etapas/**/*',
    'diagnostico/**/*'
  ]);
  contiene('docs/bloque-18-diagnostico-final.md', [
    'Diagnóstico final y verificadores',
    'GET /api/autovideo/diagnostico/final-redisenio',
    'node scripts/verificar-bloque-18-autovideo.js',
    'siguiente_bloque: ninguno'
  ]);
}

function verificarArchivosFinales() {
  const requeridos = [
    'entender/etapas/entendimiento-etapa.service.js',
    'etapas/02-plan/procesar-plan-edicion.service.js',
    'etapas/03-produccion/procesar-produccion-maestro.service.js',
    'etapas/04-adaptacion/procesar-adaptacion-plataformas.service.js',
    'etapas/05-resultado/procesar-resultado-final.service.js',
    'app/pantallas/entendimiento.view.js',
    'app/pantallas/plan-edicion.view.js',
    'app/pantallas/produccion.view.js',
    'app/pantallas/adaptacion.view.js',
    'app/pantallas/resultado.view.js',
    'app/etapas-ui/entendimiento-ui.js',
    'app/etapas-ui/plan-edicion-ui.js',
    'app/etapas-ui/produccion-maestro-ui.js',
    'app/etapas-ui/adaptacion-ui.js',
    'app/resultado-final-ui.js'
  ];
  requeridos.forEach((ruta) => exigir(fs.existsSync(ruta), 'Falta archivo final del flujo: ' + ruta));
}

async function verificarImportacionReal() {
  const servicio = await import('../diagnostico/diagnostico-final-redisenio.service.js');
  exigir(typeof servicio.crearDiagnosticoFinalRedisenio === 'function', 'crearDiagnosticoFinalRedisenio no se exporta como función.');
  const diagnostico = await servicio.crearDiagnosticoFinalRedisenio({ guardarReporte: false });
  exigir(diagnostico?.tipo === 'diagnostico-final-redisenio', 'El diagnóstico final no devolvió el tipo esperado.');
  exigir(diagnostico?.resumen?.bloquesRevisados === 18, 'El diagnóstico final no reconoce los 18 bloques.');
  exigir(diagnostico?.ok === true, 'El diagnóstico final encontró errores: ' + (diagnostico.errores || []).join(' | '));
}

async function main() {
  verificarServicioFinal();
  verificarRutasFinales();
  verificarPantallaDiagnostico();
  verificarPackageYDocs();
  verificarArchivosFinales();
  await verificarImportacionReal();
  console.log('OK Bloque 18: diagnóstico final y verificadores cerrados.');
}

main().catch((error) => {
  console.error('ERROR Bloque 18:', error.message);
  process.exit(1);
});
