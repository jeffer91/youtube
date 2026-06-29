/*
  Bloque 13 + rediseño visual por pasos
  Funcion: cargar, filtrar y reabrir proyectos recientes desde el servidor local.
*/

import { aplicarProcesoVisual } from './procesos-ui/proceso-visual.service.js';

const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';
const STORAGE_HISTORIAL_STEP = 'autovideojeff.historialPaso';
const PASOS_HISTORIAL = ['cargar', 'revisar', 'buscar', 'reabrir', 'metadata'];
const MAPA_PASO_PROCESO = Object.freeze({
  cargar: 'cargar',
  revisar: 'revisar',
  buscar: 'buscar',
  reabrir: 'reabrir',
  metadata: 'metadata'
});

let proyectosHistorial = [];
let proyectoSeleccionado = null;

function obtenerDocumento() {
  return typeof document === 'undefined' ? null : document;
}

function asegurarEstilosHistorial() {
  const doc = obtenerDocumento();
  if (!doc || doc.getElementById('historyProjectsStyles')) return;
  const link = doc.createElement('link');
  link.id = 'historyProjectsStyles';
  link.rel = 'stylesheet';
  link.href = './historial-proyectos.css';
  doc.head.appendChild(link);
}

function escapar(texto = '') {
  return String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
}

export function normalizarProyectoHistorial(proyecto = {}) {
  return {
    id: proyecto.id || proyecto.proyectoId || 'sin-id',
    nombre: proyecto.nombre || proyecto.titulo || proyecto.id || 'Proyecto sin nombre',
    perfil: proyecto.perfil || proyecto.configuracion?.perfil || 'general',
    estado: proyecto.estado || 'activo',
    plataformas: Array.isArray(proyecto.plataformas) ? proyecto.plataformas : [],
    actualizadoEn: proyecto.actualizadoEn || proyecto.creadoEn || proyecto.fecha || '',
    error: proyecto.error || '',
    ruta: proyecto.ruta || proyecto.rutaRelativa || proyecto.directorio || '',
    etapas: proyecto.etapas || proyecto.estadoEtapas || {},
    raw: proyecto
  };
}

export function renderProyectoHistorialCard(proyectoEntrada = {}) {
  const proyecto = normalizarProyectoHistorial(proyectoEntrada);
  const plataformas = proyecto.plataformas.length ? proyecto.plataformas.join(', ') : 'sin plataformas registradas';
  const estado = proyecto.error ? 'error' : proyecto.estado;
  return `
    <article class="history-project-card ${proyecto.error ? 'has-error' : ''}" data-project-id="${escapar(proyecto.id)}">
      <div>
        <strong>${escapar(proyecto.nombre)}</strong>
        <span>${escapar(proyecto.id)}</span>
      </div>
      <p>Perfil: ${escapar(proyecto.perfil)} · Plataformas: ${escapar(plataformas)}</p>
      <footer><small>Estado: ${escapar(estado)} · ${escapar(formatearFecha(proyecto.actualizadoEn))}</small></footer>
      ${proyecto.error ? `<p class="history-error">${escapar(proyecto.error)}</p>` : ''}
      <div class="history-card-actions">
        <button class="history-mini-button" type="button" data-history-action="select-project" data-project-id="${escapar(proyecto.id)}">Seleccionar</button>
        <button class="history-mini-button is-primary" type="button" data-history-action="reopen-project" data-project-id="${escapar(proyecto.id)}">Reabrir</button>
      </div>
    </article>
  `;
}

export function renderHistorialProyectos(proyectos = []) {
  if (!proyectos.length) {
    return '<div class="history-empty">Todavía no hay proyectos guardados en el historial local.</div>';
  }
  return proyectos.map(renderProyectoHistorialCard).join('');
}

async function leerJsonSeguro(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return {};
  try {
    return JSON.parse(texto);
  } catch (_error) {
    return { ok: false, mensaje: texto };
  }
}

async function cargarProyectos({ crearUrlApi } = {}) {
  if (typeof crearUrlApi !== 'function') throw new Error('No se configuro crearUrlApi para historial.');
  const respuesta = await fetch(await crearUrlApi('/api/autovideo/proyectos'), { method: 'GET' });
  const datos = await leerJsonSeguro(respuesta);
  if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || 'No se pudo cargar historial de proyectos.');
  return Array.isArray(datos.proyectos) ? datos.proyectos : [];
}

function setChip(textoChip, tipo = 'normal') {
  const chip = document.getElementById('historyStateChip');
  if (!chip) return;
  chip.textContent = textoChip;
  chip.className = `aj-status-chip history-chip is-${tipo}`;
}

function setMensaje(mensaje, tipo = 'normal') {
  const box = document.getElementById('historyProjectsMessage');
  if (!box) return;
  box.hidden = false;
  box.textContent = mensaje;
  box.className = `history-message is-${tipo}`;
}

function activarPasoHistorial(paso = 'cargar', { guardar = true } = {}) {
  const root = document.querySelector('[data-history-root]');
  if (!root) return false;
  const pasoFinal = PASOS_HISTORIAL.includes(paso) ? paso : 'cargar';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'cargar';
  root.querySelectorAll('[data-history-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.historyWizardPanel === pasoFinal;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });
  const hayProyectos = proyectosHistorial.length > 0;
  root.querySelectorAll('[data-history-wizard-go]').forEach((boton) => {
    const id = boton.dataset.historyWizardGo;
    const disponible = id === 'cargar' || id === 'metadata' || hayProyectos || (id === 'reabrir' && proyectoSeleccionado);
    const completo = hayProyectos && ['cargar', 'revisar', 'buscar'].includes(id);
    boton.classList.toggle('is-active', id === pasoFinal);
    boton.classList.toggle('is-done', id !== pasoFinal && completo);
    boton.classList.toggle('is-locked', id !== pasoFinal && !disponible);
    boton.classList.toggle('is-advanced', id === 'metadata' && id !== pasoFinal);
  });
  aplicarProcesoVisual({ contenedor: root, procesoId: 'historial', pasoActivoId: root.dataset.procesoPasoActivo });
  if (guardar) localStorage.setItem(STORAGE_HISTORIAL_STEP, pasoFinal);
  return true;
}

function llenarFiltros(proyectos = []) {
  const select = document.getElementById('historyProfileFilter');
  if (!select) return;
  const perfiles = [...new Set(proyectos.map((item) => normalizarProyectoHistorial(item).perfil).filter(Boolean))].sort();
  const actual = select.value;
  select.innerHTML = '<option value="">Todos los perfiles</option>' + perfiles.map((perfil) => `<option value="${escapar(perfil)}">${escapar(perfil)}</option>`).join('');
  if (perfiles.includes(actual)) select.value = actual;
}

function obtenerFiltros() {
  return {
    q: document.getElementById('historySearchInput')?.value?.trim().toLowerCase() || '',
    estado: document.getElementById('historyStateFilter')?.value || '',
    perfil: document.getElementById('historyProfileFilter')?.value || ''
  };
}

function filtrarProyectos(proyectos = proyectosHistorial) {
  const filtros = obtenerFiltros();
  return proyectos.map(normalizarProyectoHistorial).filter((proyecto) => {
    const texto = `${proyecto.id} ${proyecto.nombre} ${proyecto.perfil} ${proyecto.estado} ${proyecto.plataformas.join(' ')}`.toLowerCase();
    const coincideTexto = !filtros.q || texto.includes(filtros.q);
    const estadoReal = proyecto.error ? 'error' : proyecto.estado;
    const coincideEstado = !filtros.estado || estadoReal === filtros.estado;
    const coincidePerfil = !filtros.perfil || proyecto.perfil === filtros.perfil;
    return coincideTexto && coincideEstado && coincidePerfil;
  });
}

function renderFiltros() {
  const contenedor = document.getElementById('historyFilteredList');
  const resumen = document.getElementById('historyFilterSummary');
  if (!contenedor) return;
  const filtrados = filtrarProyectos();
  contenedor.innerHTML = renderHistorialProyectos(filtrados);
  if (resumen) resumen.textContent = `${filtrados.length} de ${proyectosHistorial.length} proyecto(s) visibles con filtros.`;
}

function renderMetadata() {
  const contenedor = document.getElementById('historyMetadataPanel');
  if (!contenedor) return;
  if (!proyectosHistorial.length) {
    contenedor.innerHTML = '<div class="history-empty">Carga el historial para ver metadata.</div>';
    return;
  }
  const normalizados = proyectosHistorial.map(normalizarProyectoHistorial);
  const conError = normalizados.filter((item) => item.error).length;
  const perfiles = new Set(normalizados.map((item) => item.perfil)).size;
  const plataformas = new Set(normalizados.flatMap((item) => item.plataformas)).size;
  const ultimo = normalizados.slice().sort((a, b) => new Date(b.actualizadoEn || 0) - new Date(a.actualizadoEn || 0))[0];
  contenedor.innerHTML = `
    <article><span>Total proyectos</span><strong>${normalizados.length}</strong></article>
    <article><span>Perfiles usados</span><strong>${perfiles}</strong></article>
    <article><span>Plataformas distintas</span><strong>${plataformas}</strong></article>
    <article><span>Con error</span><strong>${conError}</strong></article>
    <article class="history-metadata-wide"><span>Último actualizado</span><strong>${escapar(ultimo?.nombre || '—')}</strong><small>${escapar(formatearFecha(ultimo?.actualizadoEn))}</small></article>
  `;
}

function seleccionarProyecto(proyectoId) {
  const proyecto = proyectosHistorial.map(normalizarProyectoHistorial).find((item) => item.id === proyectoId);
  if (!proyecto) return false;
  proyectoSeleccionado = proyecto;
  const contenedor = document.getElementById('historySelectedProject');
  const boton = document.getElementById('historyReopenBtn');
  if (contenedor) {
    contenedor.innerHTML = `
      <article class="history-selected-card">
        <strong>${escapar(proyecto.nombre)}</strong>
        <span>${escapar(proyecto.id)}</span>
        <p>Perfil: ${escapar(proyecto.perfil)} · Estado: ${escapar(proyecto.error ? 'error' : proyecto.estado)}</p>
        <small>Actualizado: ${escapar(formatearFecha(proyecto.actualizadoEn))}</small>
      </article>
    `;
  }
  if (boton) boton.disabled = false;
  activarPasoHistorial('reabrir');
  return true;
}

function reabrirProyecto(proyectoId = proyectoSeleccionado?.id) {
  if (!proyectoId) {
    setMensaje('Selecciona un proyecto antes de reabrir.', 'warn');
    activarPasoHistorial('reabrir');
    return false;
  }
  localStorage.setItem(STORAGE_PROYECTO_ETAPAS, proyectoId);
  setMensaje(`Proyecto ${proyectoId} seleccionado. Abriendo Entendimiento...`, 'ok');
  document.querySelector('[data-pantalla="entendimiento"]')?.click();
  setTimeout(() => {
    const input = document.getElementById('entendimientoProyectoId');
    if (input) input.value = proyectoId;
    document.getElementById('entendimientoCargarBtn')?.click();
  }, 180);
  return true;
}

export async function recargarHistorialProyectosUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilosHistorial();
  const lista = doc.getElementById('historyProjectsList');
  const resumen = doc.getElementById('historyProjectsSummary');
  const estado = doc.getElementById('historyProjectsStatus');
  if (!lista) return false;

  try {
    if (estado) estado.textContent = 'Cargando historial...';
    setChip('Cargando...', 'normal');
    const proyectos = await cargarProyectos({ crearUrlApi });
    proyectosHistorial = proyectos.map(normalizarProyectoHistorial);
    llenarFiltros(proyectosHistorial);
    lista.innerHTML = renderHistorialProyectos(proyectosHistorial);
    renderFiltros();
    renderMetadata();
    if (resumen) resumen.textContent = `${proyectosHistorial.length} proyecto(s) en historial local.`;
    if (estado) estado.textContent = proyectosHistorial.length ? 'Historial actualizado.' : 'Sin proyectos guardados.';
    setChip(proyectosHistorial.length ? 'Actualizado' : 'Vacío', proyectosHistorial.length ? 'ok' : 'warn');
    activarPasoHistorial(proyectosHistorial.length ? 'revisar' : 'cargar');
    return true;
  } catch (error) {
    lista.innerHTML = `<div class="history-empty has-error">${escapar(error.message)}</div>`;
    if (resumen) resumen.textContent = 'No se pudo leer el historial.';
    if (estado) estado.textContent = 'Error al cargar historial.';
    setChip('Error', 'warn');
    setMensaje(error.message, 'error');
    activarPasoHistorial('cargar');
    return false;
  }
}

export function inicializarHistorialProyectosUI({ crearUrlApi } = {}) {
  const doc = obtenerDocumento();
  if (!doc) return false;
  asegurarEstilosHistorial();

  doc.addEventListener('click', (evento) => {
    const paso = evento.target.closest('[data-history-wizard-go]')?.dataset.historyWizardGo;
    if (paso) {
      if (paso !== 'cargar' && paso !== 'metadata' && !proyectosHistorial.length) {
        setMensaje('Primero carga el historial.', 'warn');
        activarPasoHistorial('cargar');
        return;
      }
      activarPasoHistorial(paso);
      if (paso === 'buscar') renderFiltros();
      if (paso === 'metadata') renderMetadata();
      return;
    }

    const accion = evento.target.closest('[data-history-action]')?.dataset.historyAction;
    if (!accion) return;
    if (accion === 'reload') recargarHistorialProyectosUI({ crearUrlApi });
    if (accion === 'clear-filters') {
      const q = doc.getElementById('historySearchInput');
      const estado = doc.getElementById('historyStateFilter');
      const perfil = doc.getElementById('historyProfileFilter');
      if (q) q.value = '';
      if (estado) estado.value = '';
      if (perfil) perfil.value = '';
      renderFiltros();
    }
    if (accion === 'select-project') seleccionarProyecto(evento.target.closest('[data-project-id]')?.dataset.projectId || evento.target.dataset.projectId);
    if (accion === 'reopen-project') reabrirProyecto(evento.target.closest('[data-project-id]')?.dataset.projectId || evento.target.dataset.projectId);
    if (accion === 'reopen') reabrirProyecto();
  });

  doc.addEventListener('input', (evento) => {
    if (evento.target?.id === 'historySearchInput') renderFiltros();
  });
  doc.addEventListener('change', (evento) => {
    if (['historyStateFilter', 'historyProfileFilter'].includes(evento.target?.id)) renderFiltros();
  });

  doc.addEventListener('autovideo:navegacion', (evento) => {
    if (evento.detail?.pantallaId === 'historial') {
      activarPasoHistorial(localStorage.getItem(STORAGE_HISTORIAL_STEP) || 'cargar', { guardar: false });
      recargarHistorialProyectosUI({ crearUrlApi });
    }
  });

  return true;
}
