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

function verificarServicioAdaptacion() {
  contiene('etapas/04-adaptacion/procesar-adaptacion-plataformas.service.js', [
    'Bloque 15: Adaptación a plataformas backend',
    'procesarAdaptacionPlataformasProyectoEtapa',
    'prepararExportaciones',
    'crearResultadoPlataformas',
    'renderizarPlataformasPendientes',
    'normalizarPlataformas',
    'obtenerSalidaBase',
    'resolverPlataformas',
    'crearResumenAdaptacion',
    'ADAPTANDO',
    'ADAPTADO',
    'listoParaResultado'
  ]);
}

function verificarRutasEtapas() {
  contiene('server/rutas-etapas.service.js', [
    'procesarAdaptacionPlataformasProyectoEtapa',
    "tipo === 'adaptacion'",
    'Adaptación a plataformas real conectada desde el Bloque 15',
    'pendienteImplementacion: false',
    '/api/proyectos/:proyectoId/adaptacion/procesar',
    '/api/proyectos/:proyectoId/adaptacion'
  ]);
}

function verificarDocumentacion() {
  contiene('docs/bloque-15-adaptacion-plataformas-backend.md', [
    'Adaptación a plataformas backend',
    'POST /api/proyectos/:proyectoId/adaptacion/procesar',
    '04-adaptacion/adaptacion-plataformas.json',
    'procesarAdaptacionPlataformasProyectoEtapa',
    'siguiente_bloque: Pantalla Adaptación'
  ]);
}

async function verificarImportacionReal() {
  const modulo = await import('../etapas/04-adaptacion/procesar-adaptacion-plataformas.service.js');
  exigir(typeof modulo.procesarAdaptacionPlataformasProyectoEtapa === 'function', 'procesarAdaptacionPlataformasProyectoEtapa no se exporta como función.');
}

async function main() {
  verificarServicioAdaptacion();
  verificarRutasEtapas();
  verificarDocumentacion();
  await verificarImportacionReal();
  console.log('OK Bloque 15: adaptación a plataformas backend conectada.');
}

main().catch((error) => {
  console.error('ERROR Bloque 15:', error.message);
  process.exit(1);
});
