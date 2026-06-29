/* Verificacion Bloque Historial: historial real de proyectos en UI guiada. */

import fs from 'fs';
import { normalizarProyectoHistorial, renderHistorialProyectos, renderProyectoHistorialCard } from '../app/historial-proyectos-ui.js';
import { renderHistorialView } from '../app/pantallas/historial.view.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(contenido, claves, contexto) {
  for (const clave of claves) exigir(contenido.includes(clave), `${contexto} no contiene ${clave}`);
}

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
  const app = leer('app/app.js');
  const navegacion = leer('app/navegacion/navegacion.service.js');
  const ui = leer('app/historial-proyectos-ui.js');
  const css = leer('app/historial-proyectos.css');
  const procesos = leer('app/procesos-ui/procesos.config.js');

  exigir(proyecto.perfil === '11-contra-11', 'No se normaliza perfil de historial.');
  exigir(card.includes('Video demo') && lista.includes('proyecto-demo'), 'No se renderiza tarjeta de historial.');
  exigir(card.includes('data-history-action="select-project"') && card.includes('data-history-action="reopen-project"'), 'La tarjeta no tiene acciones de seleccionar/reabrir.');

  contiene(vista, [
    'data-history-root',
    'data-proceso-root="historial"',
    'data-proceso-resumen="historial"',
    'data-history-wizard-go="cargar"',
    'data-history-wizard-go="revisar"',
    'data-history-wizard-go="buscar"',
    'data-history-wizard-go="reabrir"',
    'data-history-wizard-go="metadata"',
    'data-history-wizard-panel="cargar"',
    'data-history-wizard-panel="revisar"',
    'data-history-wizard-panel="buscar"',
    'data-history-wizard-panel="reabrir"',
    'data-history-wizard-panel="metadata"',
    'historyProjectsList',
    'historyFilteredList',
    'historySearchInput',
    'historySelectedProject',
    'historyReopenBtn',
    'historyMetadataPanel',
    'data-history-action="reload"'
  ], 'Vista historial');

  contiene(ui, [
    './procesos-ui/proceso-visual.service.js',
    'activarPasoHistorial',
    'MAPA_PASO_PROCESO',
    'PASOS_HISTORIAL',
    'filtrarProyectos',
    'seleccionarProyecto',
    'reabrirProyecto',
    'renderMetadata',
    'data-history-wizard-go',
    'data-history-action',
    'autovideojeff.proyectoEtapasId'
  ], 'UI historial');

  contiene(css, [
    'history-page',
    'history-flow',
    'history-step',
    'history-wizard',
    'history-wizard-panel',
    'history-filter-panel',
    'history-selected-project',
    'history-metadata'
  ], 'CSS historial');

  contiene(procesos, ['historial', 'cargar', 'revisar', 'buscar', 'reabrir', 'metadata'], 'Procesos UI');
  exigir(app.includes('inicializarHistorialProyectosUI') && app.includes('recargarHistorialProyectosUI'), 'app.js no conecta historial.');
  exigir(navegacion.includes('autovideo:navegacion'), 'Navegacion no emite evento para cargar historial.');

  console.log('OK historial proyectos UI guiado:', proyecto.id);
}

try {
  main();
} catch (error) {
  console.error('ERROR historial proyectos UI:', error.message);
  process.exit(1);
}
