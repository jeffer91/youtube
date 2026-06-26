/* Verificacion Bloque 13: historial real de proyectos en UI. */

import fs from 'fs';
import { normalizarProyectoHistorial, renderHistorialProyectos, renderProyectoHistorialCard } from '../app/historial-proyectos-ui.js';
import { renderHistorialView } from '../app/pantallas/historial.view.js';

function main() {
  const proyecto = normalizarProyectoHistorial({
    id: 'proyecto-demo',
    nombre: 'Video demo',
    perfil: '11-contra-11',
    plataformas: ['tiktok', 'youtube'],
    estado: 'activo',
    actualizadoEn: '2026-01-01T10:00:00.000Z'
  });

  const card = renderProyectoHistorialCard(proyecto);
  const lista = renderHistorialProyectos([proyecto]);
  const vista = renderHistorialView();
  const app = fs.readFileSync('app/app.js', 'utf-8');
  const navegacion = fs.readFileSync('app/navegacion/navegacion.service.js', 'utf-8');

  if (proyecto.perfil !== '11-contra-11') throw new Error('No se normaliza perfil de historial.');
  if (!card.includes('Video demo') || !lista.includes('proyecto-demo')) throw new Error('No se renderiza tarjeta de historial.');
  if (!vista.includes('historyProjectsList') || !vista.includes('data-history-action')) throw new Error('La vista historial no tiene contenedores vivos.');
  if (!app.includes('inicializarHistorialProyectosUI') || !app.includes('recargarHistorialProyectosUI')) throw new Error('app.js no conecta historial.');
  if (!navegacion.includes('autovideo:navegacion')) throw new Error('Navegacion no emite evento para cargar historial.');

  console.log('OK historial proyectos UI:', proyecto.id);
}

try {
  main();
} catch (error) {
  console.error('ERROR historial proyectos UI:', error.message);
  process.exit(1);
}
