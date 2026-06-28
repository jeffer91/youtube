/*
  Bloque 1 - Biblioteca unificada
  Verifica que Biblioteca tenga dos secciones: General y Proyecto,
  que el menu principal use una sola entrada Biblioteca,
  y que el flujo Entendimiento -> Biblioteca abra la pestaña Proyecto.
*/

import fs from 'fs';
import { renderBibliotecaView } from '../app/pantallas/biblioteca.view.js';
import { MENU_PRINCIPAL, FLUJO_PROYECTO, obtenerItemMenu } from '../app/navegacion/menu.config.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function main() {
  const vista = renderBibliotecaView();
  const bibliotecaUi = leer('app/biblioteca-ui.js');
  const bibliotecaProyectoUi = leer('app/biblioteca-proyecto-ui.js');
  const css = leer('app/biblioteca-ui.css');
  const entendimiento = leer('app/pantallas/entendimiento.view.js');
  const submenus = leer('app/navegacion/submenus.service.js');

  exigir(vista.includes('data-library-unified-root'), 'La pantalla Biblioteca no tiene raiz unificada.');
  exigir(vista.includes('data-biblioteca-area-tab="general"'), 'Falta pestaña General.');
  exigir(vista.includes('data-biblioteca-area-tab="proyecto"'), 'Falta pestaña Proyecto.');
  exigir(vista.includes('data-biblioteca-area-panel="general"'), 'Falta panel General.');
  exigir(vista.includes('data-biblioteca-area-panel="proyecto"'), 'Falta panel Proyecto.');
  exigir(vista.includes('projectLibraryProjectId'), 'La biblioteca del proyecto no se incrustó dentro de Biblioteca.');
  exigir(vista.includes('libraryNewStyles'), 'La biblioteca general no se conserva dentro de Biblioteca.');

  const entradasBibliotecaProyecto = MENU_PRINCIPAL.filter((item) => item.id === 'biblioteca-proyecto');
  const entradasBiblioteca = MENU_PRINCIPAL.filter((item) => item.id === 'biblioteca');
  exigir(entradasBibliotecaProyecto.length === 0, 'El menu principal todavía muestra Biblioteca proyecto como entrada separada.');
  exigir(entradasBiblioteca.length === 1, 'El menu principal debe tener una sola entrada Biblioteca.');

  const flujoIds = FLUJO_PROYECTO.map((item) => item.id);
  exigir(flujoIds.includes('biblioteca'), 'El flujo del proyecto no incluye Biblioteca.');
  exigir(!flujoIds.includes('biblioteca-proyecto'), 'El flujo del proyecto todavía usa Biblioteca proyecto separada.');
  exigir(flujoIds.indexOf('biblioteca') > flujoIds.indexOf('entendimiento'), 'Biblioteca debe ir despues de Entendimiento.');
  exigir(flujoIds.indexOf('biblioteca') < flujoIds.indexOf('plan-edicion'), 'Biblioteca debe ir antes del Plan.');
  exigir(obtenerItemMenu('biblioteca-proyecto').id === 'biblioteca', 'El alias biblioteca-proyecto debe redirigir a Biblioteca.');

  exigir(bibliotecaUi.includes('STORAGE_BIBLIOTECA_AREA'), 'Biblioteca UI no guarda la pestaña activa.');
  exigir(bibliotecaUi.includes('cambiarAreaBiblioteca'), 'Biblioteca UI no tiene controlador de General/Proyecto.');
  exigir(bibliotecaUi.includes('autovideo:biblioteca-area'), 'Biblioteca UI no emite evento de area.');
  exigir(bibliotecaProyectoUi.includes('STORAGE_BIBLIOTECA_AREA'), 'Biblioteca proyecto no conoce la pestaña unificada.');
  exigir(bibliotecaProyectoUi.includes('data-pantalla="biblioteca"'), 'Entendimiento debe redirigir a Biblioteca, no a Biblioteca proyecto separada.');
  exigir(bibliotecaProyectoUi.includes('autovideo:biblioteca-area'), 'Biblioteca proyecto no escucha la activacion de su pestaña.');

  exigir(css.includes('.library-area-tabs'), 'CSS no incluye pestañas General/Proyecto.');
  exigir(css.includes('.library-area-panel[hidden]'), 'CSS no oculta paneles inactivos.');
  exigir(css.includes('.library-area-panel .project-library-page'), 'CSS no adapta Biblioteca proyecto incrustada.');

  exigir(entendimiento.includes('Abrir Biblioteca > Proyecto'), 'Entendimiento no muestra el nuevo destino Biblioteca > Proyecto.');
  exigir(!submenus.includes('externos') && !submenus.includes('categorias'), 'El submenu global de Biblioteca todavia tiene opciones antiguas/duplicadas.');

  console.log('OK biblioteca unificada: General/Proyecto, menu unico, alias y flujo verificados');
}

try {
  main();
} catch (error) {
  console.error('ERROR biblioteca unificada:', error.message);
  process.exit(1);
}
