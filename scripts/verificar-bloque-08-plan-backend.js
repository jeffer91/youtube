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

function verificarServicioPlan() {
  contiene('etapas/02-plan/procesar-plan-edicion.service.js', [
    'Bloque 8: Plan de edición backend',
    'procesarPlanEdicionProyectoEtapa',
    'crearPlanProduccion',
    'validarPlanProduccion',
    'cargarResultadoEtapa',
    'crearSubtitulosDesdeTranscripcion',
    'crearTextosDesdeMomentos',
    'crearRecursosDesdeNecesidades',
    'crearVisualDesdeEntendimiento',
    'crearPlanEditorial',
    'PLANIFICANDO',
    'PLANIFICADO',
    'planProduccion',
    'listoParaProduccion'
  ]);
}

function verificarRutasEtapas() {
  contiene('server/rutas-etapas.service.js', [
    'procesarPlanEdicionProyectoEtapa',
    "tipo === 'plan'",
    'pendienteImplementacion: false',
    'Plan de edición real conectado desde el Bloque 8',
    '/api/proyectos/:proyectoId/plan/procesar',
    '/api/proyectos/:proyectoId/plan'
  ]);
}

function verificarDocumentacion() {
  contiene('docs/bloque-08-plan-edicion-backend.md', [
    'Plan de edición backend',
    'POST /api/proyectos/:proyectoId/plan/procesar',
    '02-plan/plan-edicion.json',
    'lineaTiempo',
    'siguiente_bloque: Pantalla Plan de edición'
  ]);
}

async function verificarImportacionReal() {
  const modulo = await import('../etapas/02-plan/procesar-plan-edicion.service.js');
  exigir(typeof modulo.procesarPlanEdicionProyectoEtapa === 'function', 'procesarPlanEdicionProyectoEtapa no se exporta como función.');
}

async function main() {
  verificarServicioPlan();
  verificarRutasEtapas();
  verificarDocumentacion();
  await verificarImportacionReal();
  console.log('OK Bloque 8: plan de edición backend conectado.');
}

main().catch((error) => {
  console.error('ERROR Bloque 8:', error.message);
  process.exit(1);
});
