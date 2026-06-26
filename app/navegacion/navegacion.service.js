/*
  Modulo UI: navegacion
  Funcion: renderizar menu y pantalla activa.
*/

import { MENU_PRINCIPAL, obtenerItemMenu } from './menu.config.js';
import { guardarPantallaActiva, obtenerPantallaActiva } from './estado-pantalla.service.js';
import { renderizarSubmenu } from './submenus.service.js';
import {
  renderInicioView,
  renderNuevoProyectoView,
  renderProcesadoView,
  renderProduccionView,
  renderResultadoView,
  renderBibliotecaView,
  renderHistorialView,
  renderPerfilesView,
  renderAjustesView,
  renderDiagnosticoView
} from '../pantallas/pantallas.conexion.js';

const VISTAS = Object.freeze({
  inicio: renderInicioView,
  'nuevo-proyecto': renderNuevoProyectoView,
  procesado: renderProcesadoView,
  produccion: renderProduccionView,
  resultado: renderResultadoView,
  biblioteca: renderBibliotecaView,
  historial: renderHistorialView,
  perfiles: renderPerfilesView,
  ajustes: renderAjustesView,
  diagnostico: renderDiagnosticoView
});

function renderBotonMenu(item, activo) {
  return `<button class="aj-menu-btn ${activo ? 'is-active' : ''}" type="button" data-pantalla="${item.id}"><strong>${item.titulo}</strong><small>${item.descripcion}</small></button>`;
}

export function renderizarMenuPrincipal(contenedor, pantallaActiva = 'inicio') {
  if (!contenedor) return;
  contenedor.innerHTML = `<nav class="aj-main-menu" aria-label="Menu principal AutoVideoJeff">${MENU_PRINCIPAL.map((item) => renderBotonMenu(item, item.id === pantallaActiva)).join('')}</nav>`;
}

export function renderizarPantalla(contenedor, pantallaId = 'inicio') {
  if (!contenedor) return;
  const item = obtenerItemMenu(pantallaId);
  const render = VISTAS[item.id] || VISTAS.inicio;
  contenedor.innerHTML = `${render()}${renderizarSubmenu(item.id)}`;
  guardarPantallaActiva(item.id);
}

export function cambiarPantalla({ pantallaId, contenedorMenu, contenedorVista }) {
  const item = obtenerItemMenu(pantallaId);
  renderizarMenuPrincipal(contenedorMenu, item.id);
  renderizarPantalla(contenedorVista, item.id);
}

export function inicializarNavegacionAutoVideoJeff({ contenedorMenu, contenedorVista } = {}) {
  if (!contenedorMenu || !contenedorVista) return false;
  const pantallaInicial = obtenerPantallaActiva('inicio');
  cambiarPantalla({ pantallaId: pantallaInicial, contenedorMenu, contenedorVista });
  contenedorMenu.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-pantalla]');
    if (!boton) return;
    cambiarPantalla({ pantallaId: boton.dataset.pantalla, contenedorMenu, contenedorVista });
  });
  return true;
}
