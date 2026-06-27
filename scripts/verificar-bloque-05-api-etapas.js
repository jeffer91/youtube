import fs from 'fs';

function ok(value, message) {
  if (!value) throw new Error(message);
}

function read(file) {
  ok(fs.existsSync(file), `Falta ${file}`);
  return fs.readFileSync(file, 'utf-8');
}

function includes(file, terms) {
  const text = read(file);
  for (const term of terms) ok(text.includes(term), `${file} no contiene ${term}`);
}

function checkRoutes() {
  includes('server/rutas-etapas.service.js', [
    'registrarRutasEtapas',
    '/api/proyectos',
    '/api/proyectos/:proyectoId/estado',
    '/api/proyectos/:proyectoId/videos',
    '/api/proyectos/:proyectoId/entendimiento/procesar',
    '/api/proyectos/:proyectoId/plan/procesar',
    '/api/proyectos/:proyectoId/produccion/procesar',
    '/api/proyectos/:proyectoId/adaptacion/procesar',
    '/api/proyectos/:proyectoId/resultado/exportar',
    'guardarVideosProyecto',
    'registrarSolicitudEtapa',
    'pendienteImplementacion'
  ]);
}

function checkServer() {
  includes('server/rutas-modulares.service.js', ['registrarRutasEtapas', 'api-etapas', 'flujo-etapas']);
  includes('server.js', ['registrarRutasModulares(app, { rutasBase, aplicarCabecerasSinCache, upload })', 'api-etapas', 'flujo-etapas']);
}

function checkDocs() {
  includes('docs/bloque-05-api-por-etapas.md', ['API por etapas', 'POST /api/proyectos', 'POST /api/procesar-video', 'siguiente_bloque: Entendimiento backend independiente']);
}

async function main() {
  checkRoutes();
  checkServer();
  checkDocs();
  const module = await import('../server/rutas-etapas.service.js');
  ok(typeof module.registrarRutasEtapas === 'function', 'No se exporta registrarRutasEtapas.');
  console.log('OK Bloque 5: API por etapas preparada.');
}

main().catch((error) => {
  console.error('ERROR Bloque 5:', error.message);
  process.exit(1);
});
