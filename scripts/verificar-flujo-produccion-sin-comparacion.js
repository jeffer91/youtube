import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const ruta = 'app/app.js';
  exigir(fs.existsSync(ruta), 'No existe app/app.js.');
  const js = leer(ruta);

  exigir(js.includes("import { cambiarPantalla } from './navegacion/navegacion.service.js';"), 'app.js no importa cambiarPantalla.');
  exigir(js.includes("const PANTALLA_PRODUCCION = 'produccion';"), 'No existe constante de pantalla Producción.');
  exigir(js.includes('function navegarAProduccionDespuesDeProcesar'), 'No existe función para saltar a Producción.');
  exigir(js.includes('cambiarPantalla({ pantallaId: PANTALLA_PRODUCCION'), 'No se navega a Producción al finalizar.');
  exigir(js.includes('navegarAProduccionDespuesDeProcesar();'), 'El flujo de éxito no llama navegación a Producción.');
  exigir(js.includes('limpiarComparacionNuevoProyecto();'), 'No se limpia comparación de Nuevo proyecto.');
  exigir(!js.includes('await mostrarAntesDespues('), 'Nuevo proyecto todavía intenta mostrar Antes y después.');

  console.log('OK flujo final: al 100% salta a Producción y Nuevo proyecto no muestra comparación.');
}

try {
  main();
} catch (error) {
  console.error('ERROR flujo producción/comparación:', error.message);
  process.exit(1);
}
