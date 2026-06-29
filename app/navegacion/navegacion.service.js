/*
  Modulo UI: navegacion
  Funcion: renderizar menu compacto, pantalla activa y paneles propios por pantalla.
*/

import { MENU_PRINCIPAL, obtenerItemMenu } from './menu.config.js';
import { guardarPantallaActiva, obtenerPantallaActiva } from './estado-pantalla.service.js';
import { renderizarSubmenu } from './submenus.service.js';
import { inicializarLaboratorioEfectosUI } from '../laboratorio-efectos-ui.js';
import { aplicarProcesoVisual, conectarProcesosConNavegacion } from '../procesos-ui/proceso-visual.service.js';
import {
  renderInicioView,
  renderNuevoProyectoView,
  renderEntendimientoView,
  renderBibliotecaProyectoView,
  renderPlanEdicionView,
  renderLaboratorioEfectosView,
  renderAdaptacionView,
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
  entendimiento: renderEntendimientoView,
  'biblioteca-proyecto': renderBibliotecaProyectoView,
  'plan-edicion': renderPlanEdicionView,
  'laboratorio-efectos': renderLaboratorioEfectosView,
  adaptacion: renderAdaptacionView,
  procesado: renderProcesadoView,
  produccion: renderProduccionView,
  resultado: renderResultadoView,
  biblioteca: renderBibliotecaView,
  historial: renderHistorialView,
  perfiles: renderPerfilesView,
  ajustes: renderAjustesView,
  diagnostico: renderDiagnosticoView
});

function renderLogoMenu() {
  return `
    <button class="aj-brand-button" type="button" data-pantalla="inicio" aria-label="Ir al inicio de AutoVideoJeff" title="AutoVideoJeff">
      <span class="aj-brand-logo-box" aria-hidden="true">
        <img class="aj-brand-logo" src="./assets/logo-autovideojeff.png" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false" />
        <span class="aj-brand-fallback" hidden>AJ</span>
      </span>
    </button>
  `;
}

function renderBotonMenu(item, activo) {
  return `<button class="aj-menu-btn ${activo ? 'is-active' : ''}" type="button" data-pantalla="${item.id}" title="${item.descripcion || item.titulo}" aria-label="Abrir ${item.titulo}"><strong>${item.titulo}</strong></button>`;
}

function marcarPantallaActiva(item) {
  if (typeof document === 'undefined') return;
  document.body.dataset.pantallaActiva = item.id;
}

function emitirEventoNavegacion(item) {
  if (typeof document === 'undefined') return;
  document.dispatchEvent(new CustomEvent('autovideo:navegacion', {
    detail: {
      pantallaId: item.id,
      titulo: item.titulo,
      fecha: new Date().toISOString()
    }
  }));
}

function inicializarPantallaEspecial(item) {
  if (item.id === 'laboratorio-efectos') setTimeout(inicializarLaboratorioEfectosUI, 0);
}

export function renderizarMenuPrincipal(contenedor, pantallaActiva = 'inicio') {
  if (!contenedor) return;
  contenedor.innerHTML = `<nav class="aj-main-menu" aria-label="Menu principal AutoVideoJeff">${renderLogoMenu()}${MENU_PRINCIPAL.map((item) => renderBotonMenu(item, item.id === pantallaActiva)).join('')}</nav>`;
}

export function renderizarPantalla(contenedor, pantallaId = 'inicio') {
  if (!contenedor) return;
  const item = obtenerItemMenu(pantallaId);
  const render = VISTAS[item.id] || VISTAS.inicio;
  marcarPantallaActiva(item);
  contenedor.innerHTML = `${render()}${renderizarSubmenu(item.id)}`;
  aplicarProcesoVisual({ pantallaId: item.id, contenedor });
  guardarPantallaActiva(item.id);
  emitirEventoNavegacion(item);
  inicializarPantallaEspecial(item);
}

export function cambiarPantalla({ pantallaId, contenedorMenu, contenedorVista }) {
  const item = obtenerItemMenu(pantallaId);
  renderizarMenuPrincipal(contenedorMenu, item.id);
  renderizarPantalla(contenedorVista, item.id);
}

export function inicializarNavegacionAutoVideoJeff({ contenedorMenu, contenedorVista } = {}) {
  if (!contenedorMenu || !contenedorVista) return false;
  conectarProcesosConNavegacion(contenedorVista);
  const pantallaInicial = obtenerPantallaActiva('inicio');
  cambiarPantalla({ pantallaId: pantallaInicial, contenedorMenu, contenedorVista });
  contenedorMenu.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-pantalla]');
    if (!boton) return;
    cambiarPantalla({ pantallaId: boton.dataset.pantalla, contenedorMenu, contenedorVista });
  });
  contenedorVista.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-pantalla-destino]');
    if (!boton) return;
    cambiarPantalla({ pantallaId: boton.dataset.pantallaDestino, contenedorMenu, contenedorVista });
  });
  return true;
}