/* Verificacion Bloque 16: biblioteca real en pantalla. */

import fs from 'fs';
import { renderBibliotecaView } from '../app/pantallas/biblioteca.view.js';
import { renderRecursosBiblioteca } from '../app/biblioteca-ui.js';

function main() {
  const vista = renderBibliotecaView();
  const lista = renderRecursosBiblioteca([
    { id: 'recurso-1', nombre: 'Fondo estadio', tipo: 'fondo', categoria: 'futbol', perfil: '11-contra-11', tema: 'previa', ruta: 'C:/recursos/fondo.jpg', licencia: 'propio', estado: 'disponible' }
  ]);
  const ui = fs.readFileSync('app/biblioteca-ui.js', 'utf-8');
  const app = fs.readFileSync('app/app.js', 'utf-8');

  if (!vista.includes('libraryResourcesList') || !vista.includes('data-library-action="save"')) throw new Error('Vista Biblioteca incompleta.');
  if (!lista.includes('Fondo estadio') || !lista.includes('futbol')) throw new Error('Render de recursos incompleto.');
  if (!ui.includes('/api/autovideo/biblioteca') || !ui.includes('recargarBibliotecaUI')) throw new Error('UI Biblioteca no conecta API.');
  if (!app.includes('inicializarBibliotecaUI')) throw new Error('app.js no inicializa Biblioteca.');

  console.log('OK biblioteca UI: recursos, filtros y guardado conectados');
}

try {
  main();
} catch (error) {
  console.error('ERROR biblioteca UI:', error.message);
  process.exit(1);
}
