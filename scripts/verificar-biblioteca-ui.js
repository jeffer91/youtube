/* Verificacion Biblioteca UI: pantalla Carga guiada y Recursos. */

import fs from 'fs';
import { renderBibliotecaView } from '../app/pantallas/biblioteca.view.js';
import { renderRecursosBiblioteca } from '../app/biblioteca-ui.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function contiene(contenido, claves, contexto) {
  for (const clave of claves) exigir(contenido.includes(clave), `${contexto} no contiene ${clave}`);
}

function main() {
  const vista = renderBibliotecaView();
  const tarjetas = renderRecursosBiblioteca([
    { id: 'recurso-1', nombre: 'Intro 11 contra 11', tipo: 'video', categoria: 'intro', categoriaNombre: 'Intro', estilos: ['11-contra-11'], formato: 'horizontal-16-9', etiquetas: ['intro'], ruta: 'D:/AutoVideoJeff/datos/biblioteca/general/archivos/intro.mp4', licencia: 'propio', estadoTecnico: 'listo' }
  ]);
  const tabla = renderRecursosBiblioteca([
    { id: 'recurso-1', nombre: 'Intro 11 contra 11', tipo: 'video', categoria: 'intro', estilos: ['11-contra-11'], formato: 'horizontal-16-9', estadoTecnico: 'listo' }
  ], 'table');
  const ui = fs.readFileSync('app/biblioteca-ui.js', 'utf-8');
  const css = fs.readFileSync('app/biblioteca-ui.css', 'utf-8');
  const procesos = fs.readFileSync('app/procesos-ui/procesos.config.js', 'utf-8');
  const rutas = fs.readFileSync('server/rutas-modulares.service.js', 'utf-8');
  const main = fs.readFileSync('main.js', 'utf-8');
  const preload = fs.readFileSync('preload.js', 'utf-8');

  contiene(vista, [
    'data-proceso-root="biblioteca-general"',
    'data-proceso-resumen="biblioteca-general"',
    'data-library-tab="carga"',
    'data-library-tab="recursos"',
    'data-library-wizard-panel="archivo"',
    'data-library-wizard-panel="categoria"',
    'data-library-wizard-panel="datos"',
    'data-library-wizard-panel="guardar"',
    'libraryNewStyles',
    'libraryNewCategory',
    'libraryNewFormat',
    'libraryDuplicateBox'
  ], 'Vista biblioteca');

  exigir(tarjetas.includes('Intro 11 contra 11') && tarjetas.includes('11-contra-11'), 'Render de tarjetas incompleto.');
  exigir(tabla.includes('<table') && tabla.includes('horizontal-16-9'), 'Vista tabla incompleta.');

  contiene(ui, [
    './procesos-ui/proceso-visual.service.js',
    'activarPasoBibliotecaGeneral',
    'irAPasoBibliotecaGeneral',
    'MAPA_PASO_PROCESO',
    'data-library-wizard-go',
    '/api/autovideo/biblioteca/estilos',
    'duplicate-replace',
    'duplicate-copy'
  ], 'UI Biblioteca');

  contiene(css, [
    '.library-guided-layout',
    '.library-guided-rail',
    '.library-wizard-step',
    '.library-wizard-panel',
    '.library-save-review',
    '.library-advanced-filters'
  ], 'CSS Biblioteca');

  contiene(procesos, ['biblioteca-general', 'subir-archivo', 'categoria', 'datos-basicos', 'guardar', 'revisar'], 'Procesos UI');
  exigir(rutas.includes('/api/autovideo/biblioteca/estilos') && rutas.includes('guardarRecursoBiblioteca(payload'), 'Rutas API biblioteca incompletas.');
  exigir(main.includes('biblioteca:seleccionarArchivo') && preload.includes('seleccionarArchivo'), 'Selector seguro de archivos no expuesto a UI.');

  console.log('OK biblioteca UI guiada: carga por pasos, recursos, API, CSS y proceso visual conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR biblioteca UI:', error.message);
  process.exit(1);
}
