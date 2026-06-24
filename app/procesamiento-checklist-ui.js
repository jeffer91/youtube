/*
  Nombre completo: procesamiento-checklist-ui.js
  Ruta: /app/procesamiento-checklist-ui.js

  Función:
  - Crear el modal checklist antes de procesar.
  - Mostrar opciones por grupos tipo acordeón.
  - Permitir Marcar todo y Desmarcar todo.
  - Validar que haya al menos una función seleccionada.
  - Aplicar reglas automáticas de dependencia.
*/

import {
  obtenerGruposChecklistProcesamiento,
  obtenerOpcionesChecklistPorDefecto
} from './procesamiento-checklist-config.js';

import {
  aplicarReglasDependencias,
  validarOpcionesChecklist
} from './procesamiento-checklist-reglas.js';

const SELECTORES = Object.freeze({
  modal: 'avjChecklistProcesamientoModal',
  listado: 'avjChecklistProcesamientoListado',
  aviso: 'avjChecklistProcesamientoAviso',
  error: 'avjChecklistProcesamientoError',
  btnMarcarTodo: 'avjChecklistMarcarTodo',
  btnDesmarcarTodo: 'avjChecklistDesmarcarTodo',
  btnCancelar: 'avjChecklistCancelar',
  btnProcesar: 'avjChecklistProcesar'
});

let inicializado = false;
let resolverModalActivo = null;
let opcionesActuales = obtenerOpcionesChecklistPorDefecto();

function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function crearModalSiNoExiste() {
  if (document.getElementById(SELECTORES.modal)) return;

  const modal = document.createElement('div');
  modal.id = SELECTORES.modal;
  modal.className = 'avj-checklist-modal';
  modal.setAttribute('hidden', 'hidden');

  modal.innerHTML = `
    <div class="avj-checklist-backdrop" data-avj-checklist-cancelar="1"></div>

    <section class="avj-checklist-panel" role="dialog" aria-modal="true" aria-labelledby="avjChecklistTitulo">
      <header class="avj-checklist-header">
        <div>
          <p class="avj-checklist-kicker">Antes de procesar</p>
          <h2 id="avjChecklistTitulo">Elige qué se va a procesar</h2>
        </div>

        <button type="button" class="avj-checklist-cerrar" data-avj-checklist-cancelar="1" aria-label="Cerrar">×</button>
      </header>

      <div class="avj-checklist-toolbar">
        <button type="button" id="${SELECTORES.btnMarcarTodo}" class="avj-checklist-btn avj-checklist-btn-secundario">Marcar todo</button>
        <button type="button" id="${SELECTORES.btnDesmarcarTodo}" class="avj-checklist-btn avj-checklist-btn-secundario">Desmarcar todo</button>
      </div>

      <div id="${SELECTORES.aviso}" class="avj-checklist-aviso" hidden></div>
      <div id="${SELECTORES.error}" class="avj-checklist-error" hidden></div>

      <div id="${SELECTORES.listado}" class="avj-checklist-listado"></div>

      <footer class="avj-checklist-footer">
        <button type="button" id="${SELECTORES.btnCancelar}" class="avj-checklist-btn avj-checklist-btn-secundario">Cancelar</button>
        <button type="button" id="${SELECTORES.btnProcesar}" class="avj-checklist-btn avj-checklist-btn-principal">Procesar</button>
      </footer>
    </section>
  `;

  document.body.appendChild(modal);
}

function obtenerElemento(id) {
  return document.getElementById(id);
}

function obtenerModal() {
  return obtenerElemento(SELECTORES.modal);
}

function renderizarGrupos(opciones = {}) {
  const grupos = obtenerGruposChecklistProcesamiento();

  return grupos.map((grupo) => {
    const items = grupo.items.map((item) => {
      const checked = opciones[item.clave] === true ? 'checked' : '';

      return `
        <label class="avj-checklist-item">
          <input type="checkbox" data-avj-checklist-opcion="${escaparHtml(item.clave)}" ${checked} />
          <span>${escaparHtml(item.etiqueta)}</span>
        </label>
      `;
    }).join('');

    return `
      <article class="avj-checklist-grupo ${grupo.abierto ? 'is-open' : ''}" data-avj-checklist-grupo="${escaparHtml(grupo.id)}">
        <button type="button" class="avj-checklist-grupo-titulo" data-avj-checklist-toggle="${escaparHtml(grupo.id)}">
          <span>${escaparHtml(grupo.titulo)}</span>
          <strong aria-hidden="true">⌄</strong>
        </button>
        <div class="avj-checklist-grupo-contenido">${items}</div>
      </article>
    `;
  }).join('');
}

function sincronizarChecksConEstado() {
  document.querySelectorAll('[data-avj-checklist-opcion]').forEach((input) => {
    const clave = input.getAttribute('data-avj-checklist-opcion');
    input.checked = opcionesActuales[clave] === true;
  });
}

function mostrarAvisos(avisos = []) {
  const aviso = obtenerElemento(SELECTORES.aviso);
  if (!aviso) return;

  if (!avisos.length) {
    aviso.hidden = true;
    aviso.textContent = '';
    return;
  }

  aviso.hidden = false;
  aviso.textContent = avisos.join(' ');
}

function mostrarError(mensaje = '') {
  const error = obtenerElemento(SELECTORES.error);
  if (!error) return;

  if (!mensaje) {
    error.hidden = true;
    error.textContent = '';
    return;
  }

  error.hidden = false;
  error.textContent = mensaje;
}

function aplicarReglasYRefrescar() {
  const resultado = aplicarReglasDependencias(opcionesActuales);
  opcionesActuales = resultado.opciones;
  sincronizarChecksConEstado();
  mostrarAvisos(resultado.avisos);
}

function leerOpcionesDesdeInputs() {
  const opciones = {};

  document.querySelectorAll('[data-avj-checklist-opcion]').forEach((input) => {
    const clave = input.getAttribute('data-avj-checklist-opcion');
    if (clave) opciones[clave] = input.checked === true;
  });

  return opciones;
}

function cerrarModal(respuesta = null) {
  const modal = obtenerModal();

  if (modal) {
    modal.setAttribute('hidden', 'hidden');
    modal.classList.remove('is-open');
  }

  mostrarAvisos([]);
  mostrarError('');

  if (typeof resolverModalActivo === 'function') {
    resolverModalActivo(respuesta);
    resolverModalActivo = null;
  }
}

function abrirModal() {
  const modal = obtenerModal();
  const listado = obtenerElemento(SELECTORES.listado);

  opcionesActuales = obtenerOpcionesChecklistPorDefecto();

  if (listado) listado.innerHTML = renderizarGrupos(opcionesActuales);

  mostrarAvisos([]);
  mostrarError('');

  if (modal) {
    modal.removeAttribute('hidden');
    modal.classList.add('is-open');
  }
}

function marcarTodo(valor) {
  Object.keys(opcionesActuales).forEach((clave) => {
    opcionesActuales[clave] = valor === true;
  });

  aplicarReglasYRefrescar();
  mostrarError('');
}

function manejarClick(evento) {
  const target = evento.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.closest('[data-avj-checklist-cancelar="1"]')) {
    cerrarModal(null);
    return;
  }

  const botonToggle = target.closest('[data-avj-checklist-toggle]');
  if (!botonToggle) return;

  const grupoId = botonToggle.getAttribute('data-avj-checklist-toggle');
  const grupo = document.querySelector(`[data-avj-checklist-grupo="${grupoId}"]`);
  if (grupo) grupo.classList.toggle('is-open');
}

function manejarCambio(evento) {
  const target = evento.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (!target.matches('[data-avj-checklist-opcion]')) return;

  opcionesActuales = leerOpcionesDesdeInputs();
  aplicarReglasYRefrescar();
  mostrarError('');
}

function manejarProcesar() {
  opcionesActuales = leerOpcionesDesdeInputs();
  const validacion = validarOpcionesChecklist(opcionesActuales);

  if (!validacion.ok) {
    opcionesActuales = validacion.opciones;
    sincronizarChecksConEstado();
    mostrarAvisos(validacion.avisos);
    mostrarError(validacion.errores[0] || 'Debes seleccionar al menos una función.');
    return;
  }

  cerrarModal(validacion.opciones);
}

export function inicializarChecklistProcesamiento() {
  if (inicializado) return;

  crearModalSiNoExiste();

  const modal = obtenerModal();
  const btnMarcarTodo = obtenerElemento(SELECTORES.btnMarcarTodo);
  const btnDesmarcarTodo = obtenerElemento(SELECTORES.btnDesmarcarTodo);
  const btnCancelar = obtenerElemento(SELECTORES.btnCancelar);
  const btnProcesar = obtenerElemento(SELECTORES.btnProcesar);

  modal?.addEventListener('click', manejarClick);
  modal?.addEventListener('change', manejarCambio);
  btnMarcarTodo?.addEventListener('click', () => marcarTodo(true));
  btnDesmarcarTodo?.addEventListener('click', () => marcarTodo(false));
  btnCancelar?.addEventListener('click', () => cerrarModal(null));
  btnProcesar?.addEventListener('click', manejarProcesar);

  inicializado = true;
}

export function abrirChecklistProcesamiento() {
  inicializarChecklistProcesamiento();

  return new Promise((resolve) => {
    resolverModalActivo = resolve;
    abrirModal();
  });
}

export function obtenerOpcionesChecklistActuales() {
  return { ...opcionesActuales };
}

export default {
  inicializarChecklistProcesamiento,
  abrirChecklistProcesamiento,
  obtenerOpcionesChecklistActuales
};
