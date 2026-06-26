/* Verificacion Bloque 7: navegacion y pantallas UI. */

import { MENU_PRINCIPAL, FLUJO_PROYECTO, obtenerItemMenu } from '../app/navegacion/menu.config.js';
import { obtenerSubmenu, renderizarSubmenu } from '../app/navegacion/submenus.service.js';
import {
  renderInicioView,
  renderNuevoProyectoView,
  renderProduccionView,
  renderBibliotecaView,
  renderPerfilesView,
  renderDiagnosticoView
} from '../app/pantallas/pantallas.conexion.js';
import { crearProduccionController } from '../app/controladores/produccion.controller.js';
import { crearBibliotecaController } from '../app/controladores/biblioteca.controller.js';

function main() {
  if (MENU_PRINCIPAL.length !== 8) throw new Error('El menu principal debe tener 8 opciones.');
  if (FLUJO_PROYECTO.length !== 4) throw new Error('El flujo de proyecto debe tener 4 pasos.');
  if (obtenerItemMenu('produccion').id !== 'produccion') throw new Error('No se encontro pantalla Produccion.');
  if (!obtenerSubmenu('biblioteca').length) throw new Error('Biblioteca debe tener submenu.');
  if (!renderizarSubmenu('produccion').includes('Aprendizaje')) throw new Error('Produccion debe incluir aprendizaje en submenu.');

  const html = [renderInicioView(), renderNuevoProyectoView(), renderProduccionView(), renderBibliotecaView(), renderPerfilesView(), renderDiagnosticoView()].join('\n');
  if (!html.includes('AutoVideoJeff') || !html.includes('Produccion')) throw new Error('Las vistas no generan contenido esperado.');

  const produccion = crearProduccionController().obtenerEstado();
  const biblioteca = crearBibliotecaController().obtenerEstado();
  if (!produccion.listo || !biblioteca.listo) throw new Error('Controladores UI no estan listos.');

  console.log('OK navegacion UI:', MENU_PRINCIPAL.map((item) => item.id).join(', '));
}

try {
  main();
} catch (error) {
  console.error('ERROR navegacion UI:', error.message);
  process.exit(1);
}
