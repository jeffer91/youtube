/* Verificacion Bloque 8: rutas modulares del servidor. */

import { registrarRutasModulares } from '../server/rutas-modulares.service.js';

function crearAppFalsa() {
  const rutas = [];
  return {
    rutas,
    get(ruta, handler) { rutas.push({ metodo: 'GET', ruta, handler }); },
    post(ruta, handler) { rutas.push({ metodo: 'POST', ruta, handler }); }
  };
}

function main() {
  const app = crearAppFalsa();
  registrarRutasModulares(app, { aplicarCabecerasSinCache: () => {} });

  const requeridas = [
    'GET /api/autovideo/modulos',
    'GET /api/autovideo/perfiles',
    'GET /api/autovideo/plataformas',
    'GET /api/autovideo/proyectos',
    'POST /api/autovideo/proyectos',
    'GET /api/autovideo/biblioteca',
    'POST /api/autovideo/biblioteca',
    'POST /api/autovideo/produccion/crear-plan',
    'GET /api/autovideo/aprendizaje',
    'POST /api/autovideo/aprendizaje'
  ];

  const registradas = app.rutas.map((item) => `${item.metodo} ${item.ruta}`);
  const faltantes = requeridas.filter((ruta) => !registradas.includes(ruta));
  if (faltantes.length) throw new Error(`Faltan rutas modulares: ${faltantes.join(', ')}`);

  console.log('OK servidor modular:', registradas.length, 'rutas');
}

try {
  main();
} catch (error) {
  console.error('ERROR servidor modular:', error.message);
  process.exit(1);
}
