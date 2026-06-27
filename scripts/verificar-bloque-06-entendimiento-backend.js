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

function verificarServicioEntendimiento() {
  contiene('entender/etapas/entendimiento-etapa.service.js', [
    'Bloque 6: Entendimiento backend independiente',
    'procesarEntendimientoProyectoEtapa',
    'entenderVideo',
    'cargarVideosOriginalesProyecto',
    'seleccionarVideoPrincipal',
    'crearEntradaEntendimiento',
    'guardarResultadoEtapa',
    'ENTENDIENDO',
    'ENTENDIDO',
    'resumenEtapa'
  ]);
}

function verificarRutasEtapas() {
  contiene('server/rutas-etapas.service.js', [
    'procesarEntendimientoProyectoEtapa',
    "tipo === 'entendimiento'",
    'pendienteImplementacion: false',
    'Entendimiento real conectado desde el Bloque 6',
    '/api/proyectos/:proyectoId/entendimiento/procesar',
    '/api/proyectos/:proyectoId/entendimiento'
  ]);
}

function verificarDocumentacion() {
  contiene('docs/bloque-06-entendimiento-backend.md', [
    'Entendimiento backend independiente',
    'POST /api/proyectos/:proyectoId/entendimiento/procesar',
    '01-entendimiento/reporte-entendimiento.json',
    'siguiente_bloque: Pantalla Entendimiento'
  ]);
}

async function verificarImportacionReal() {
  const modulo = await import('../entender/etapas/entendimiento-etapa.service.js');
  exigir(typeof modulo.procesarEntendimientoProyectoEtapa === 'function', 'procesarEntendimientoProyectoEtapa no se exporta como función.');
}

async function main() {
  verificarServicioEntendimiento();
  verificarRutasEtapas();
  verificarDocumentacion();
  await verificarImportacionReal();
  console.log('OK Bloque 6: entendimiento backend independiente conectado.');
}

main().catch((error) => {
  console.error('ERROR Bloque 6:', error.message);
  process.exit(1);
});
