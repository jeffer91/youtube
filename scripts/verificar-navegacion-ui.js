/* Verificacion: navegacion compacta, pantallas separadas y controladores UI. */

import fs from 'fs';
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

  const inicio = renderInicioView();
  const nuevo = renderNuevoProyectoView();
  const html = [inicio, nuevo, renderProduccionView(), renderBibliotecaView(), renderPerfilesView(), renderDiagnosticoView()].join('\n');
  if (inicio.includes('videoForm') || inicio.includes('Seleccionar video')) throw new Error('Inicio no debe contener procesador de video.');
  if (!nuevo.includes('procesador principal')) throw new Error('Nuevo proyecto debe indicar el procesador principal.');
  if (!html.includes('Produccion') || !html.includes('Biblioteca')) throw new Error('Las vistas no generan contenido esperado.');

  const nav = fs.readFileSync('app/navegacion/navegacion.service.js', 'utf-8');
  if (!nav.includes('document.body.dataset.pantallaActiva')) throw new Error('La navegacion debe marcar la pantalla activa.');

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
