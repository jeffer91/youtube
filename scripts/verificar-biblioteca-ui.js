/* Verificacion Bloque Biblioteca 2: pantalla Carga y Recursos. */

import fs from 'fs';
import { renderBibliotecaView } from '../app/pantallas/biblioteca.view.js';
import { renderRecursosBiblioteca } from '../app/biblioteca-ui.js';

function main() {
  const vista = renderBibliotecaView();
  const tarjetas = renderRecursosBiblioteca([
    { id: 'recurso-1', nombre: 'Intro 11 contra 11', tipo: 'video', categoria: 'intro', categoriaNombre: 'Intro', estilos: ['11-contra-11'], formato: 'horizontal-16-9', etiquetas: ['intro'], ruta: 'D:/AutoVideoJeff/datos/biblioteca/general/archivos/intro.mp4', licencia: 'propio', estadoTecnico: 'listo' }
  ]);
  const tabla = renderRecursosBiblioteca([
    { id: 'recurso-1', nombre: 'Intro 11 contra 11', tipo: 'video', categoria: 'intro', estilos: ['11-contra-11'], formato: 'horizontal-16-9', estadoTecnico: 'listo' }
  ], 'table');
  const ui = fs.readFileSync('app/biblioteca-ui.js', 'utf-8');
  const rutas = fs.readFileSync('server/rutas-modulares.service.js', 'utf-8');
  const main = fs.readFileSync('main.js', 'utf-8');
  const preload = fs.readFileSync('preload.js', 'utf-8');

  if (!vista.includes('data-library-tab="carga"') || !vista.includes('data-library-tab="recursos"')) throw new Error('Faltan pestanas Carga y Recursos.');
  if (!vista.includes('libraryNewStyles') || !vista.includes('libraryNewCategory') || !vista.includes('libraryNewFormat')) throw new Error('Formulario compacto de carga incompleto.');
  if (!tarjetas.includes('Intro 11 contra 11') || !tarjetas.includes('11-contra-11')) throw new Error('Render de tarjetas incompleto.');
  if (!tabla.includes('<table') || !tabla.includes('horizontal-16-9')) throw new Error('Vista tabla incompleta.');
  if (!ui.includes('/api/autovideo/biblioteca/estilos') || !ui.includes('duplicate-replace')) throw new Error('UI Biblioteca no conecta estilos o duplicados.');
  if (!rutas.includes('/api/autovideo/biblioteca/estilos') || !rutas.includes('guardarRecursoBiblioteca(payload')) throw new Error('Rutas API biblioteca incompletas.');
  if (!main.includes('biblioteca:seleccionarArchivo') || !preload.includes('seleccionarArchivo')) throw new Error('Selector seguro de archivos no expuesto a UI.');

  console.log('OK biblioteca UI bloque 2: Carga y Recursos conectados');
}

try {
  main();
} catch (error) {
  console.error('ERROR biblioteca UI:', error.message);
  process.exit(1);
}
