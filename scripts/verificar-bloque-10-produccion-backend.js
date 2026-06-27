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

function verificarServicioProduccion() {
  contiene('etapas/03-produccion/procesar-produccion-maestro.service.js', [
    'Bloque 10: Producción maestro backend',
    'procesarProduccionMaestroProyectoEtapa',
    'editarVideo',
    'prepararSalida',
    'cargarResultadoEtapa',
    'crearEntradaProduccion',
    'crearOpcionesProduccion',
    'crearTranscripcionDesdeEntendimiento',
    'crearEdicionDinamicaDesdePlan',
    'crearResumenProduccion',
    'crearAuditoriaProduccion',
    'PRODUCIENDO',
    'PRODUCIDO',
    'videoMaestro',
    'listoParaAdaptacion'
  ]);
}

function verificarRutasEtapas() {
  contiene('server/rutas-etapas.service.js', [
    'procesarProduccionMaestroProyectoEtapa',
    "tipo === 'produccion'",
    'Producción maestro real conectada desde el Bloque 10',
    'pendienteImplementacion: false',
    '/api/proyectos/:proyectoId/produccion/procesar',
    '/api/proyectos/:proyectoId/produccion'
  ]);
}

function verificarDocumentacion() {
  contiene('docs/bloque-10-produccion-maestro-backend.md', [
    'Producción maestro backend',
    'POST /api/proyectos/:proyectoId/produccion/procesar',
    '03-produccion/produccion.json',
    'videoMaestro',
    'siguiente_bloque: Pantalla Producción maestro'
  ]);
}

async function verificarImportacionReal() {
  const modulo = await import('../etapas/03-produccion/procesar-produccion-maestro.service.js');
  exigir(typeof modulo.procesarProduccionMaestroProyectoEtapa === 'function', 'procesarProduccionMaestroProyectoEtapa no se exporta como función.');
}

async function main() {
  verificarServicioProduccion();
  verificarRutasEtapas();
  verificarDocumentacion();
  await verificarImportacionReal();
  console.log('OK Bloque 10: producción maestro backend conectada.');
}

main().catch((error) => {
  console.error('ERROR Bloque 10:', error.message);
  process.exit(1);
});
