import { aplicarProcesoVisual } from './procesos-ui/proceso-visual.service.js';

const STORAGE_AJUSTES_STEP = 'autovideojeff.ajustesPaso';
const PASOS_AJUSTES = ['activar', 'clave', 'modelo', 'parametros', 'probar', 'guardar', 'avanzado'];
const MAPA_PASO_PROCESO = Object.freeze({
  activar: 'activar',
  clave: 'clave',
  modelo: 'modelo',
  parametros: 'parametros',
  probar: 'probar',
  guardar: 'guardar',
  avanzado: 'guia-fallback'
});

let inicializado = false;

function $(id) { return document.getElementById(id); }

function usaGemini() {
  return Boolean($('ajustesUseGemini')?.checked);
}

function tieneClave() {
  return Boolean($('ajustesGeminiCredencial')?.value?.trim());
}

function tieneModelo() {
  return Boolean($('ajustesGeminiModelo')?.value?.trim());
}

function parametrosValidos() {
  const temp = Number($('ajustesGeminiTemperatura')?.value);
  const timeout = Number($('ajustesGeminiTimeoutMs')?.value);
  return Number.isFinite(temp) && temp >= 0 && temp <= 1 && Number.isFinite(timeout) && timeout >= 10000;
}

function setChip(texto = 'Gemini pendiente', tipo = 'normal') {
  const chip = $('ajustesStateChip');
  if (!chip) return;
  chip.textContent = texto;
  chip.className = `aj-status-chip ajustes-chip is-${tipo}`;
}

function setMensaje(texto = '', tipo = 'normal') {
  const box = $('ajustesMessage');
  if (!box) return;
  box.hidden = !texto;
  box.textContent = texto;
  box.className = `ajustes-message is-${tipo}`;
}

function estadoPaso(paso, activo) {
  const gemini = usaGemini();
  const clave = tieneClave();
  const modelo = tieneModelo();
  const parametros = parametrosValidos();
  if (paso === 'activar') return activo === paso ? 'active' : 'done';
  if (paso === 'clave') return !gemini ? (activo === paso ? 'active' : 'done') : activo === paso ? 'active' : clave ? 'done' : 'active';
  if (paso === 'modelo') return gemini && !clave ? 'locked' : activo === paso ? 'active' : modelo ? 'done' : 'active';
  if (paso === 'parametros') return !modelo ? 'locked' : activo === paso ? 'active' : parametros ? 'done' : 'active';
  if (paso === 'probar') return gemini && (!clave || !modelo || !parametros) ? 'locked' : activo === paso ? 'active' : 'done';
  if (paso === 'guardar') return !modelo || !parametros ? 'locked' : activo === paso ? 'active' : 'done';
  if (paso === 'avanzado') return activo === paso ? 'active' : 'advanced';
  return 'locked';
}

function actualizarResumenEstado() {
  if (usaGemini()) {
    if (tieneClave()) setChip('Gemini con clave', 'ok');
    else setChip('Gemini sin clave', 'warn');
  } else {
    setChip('Fallback local', 'ok');
  }
}

export function activarPasoAjustes(paso = 'activar', { guardar = true } = {}) {
  const root = document.querySelector('[data-ajustes-root]');
  if (!root) return false;
  const pasoFinal = PASOS_AJUSTES.includes(paso) ? paso : 'activar';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'activar';

  root.querySelectorAll('[data-ajustes-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.ajustesWizardPanel === pasoFinal;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });

  root.querySelectorAll('[data-ajustes-wizard-go]').forEach((boton) => {
    const id = boton.dataset.ajustesWizardGo;
    const estado = estadoPaso(id, pasoFinal);
    boton.classList.toggle('is-active', estado === 'active');
    boton.classList.toggle('is-done', estado === 'done');
    boton.classList.toggle('is-locked', estado === 'locked');
    boton.classList.toggle('is-advanced', estado === 'advanced');
  });

  aplicarProcesoVisual({ contenedor: root, procesoId: 'ajustes', pasoActivoId: root.dataset.procesoPasoActivo });
  actualizarResumenEstado();
  if (guardar) localStorage.setItem(STORAGE_AJUSTES_STEP, pasoFinal);
  return true;
}

async function irAPasoAjustes(paso = 'activar') {
  if (paso === 'modelo' && usaGemini() && !tieneClave()) {
    setMensaje('Pega la clave API o desactiva Gemini para continuar con fallback local.', 'warn');
    activarPasoAjustes('clave');
    return;
  }
  if (paso === 'parametros' && !tieneModelo()) {
    setMensaje('Primero define el modelo Gemini.', 'warn');
    activarPasoAjustes('modelo');
    return;
  }
  if (paso === 'probar' && usaGemini() && (!tieneClave() || !tieneModelo())) {
    setMensaje('Para probar Gemini necesitas clave API y modelo.', 'warn');
    activarPasoAjustes(!tieneClave() ? 'clave' : 'modelo');
    return;
  }
  if (paso === 'guardar' && (!tieneModelo() || !parametrosValidos())) {
    setMensaje('Revisa modelo, temperatura y tiempo de espera antes de guardar.', 'warn');
    activarPasoAjustes(!tieneModelo() ? 'modelo' : 'parametros');
    return;
  }
  setMensaje('', 'normal');
  activarPasoAjustes(paso);
}

function enlazarEventos() {
  const root = document.querySelector('[data-ajustes-root]');
  if (!root || root.dataset.ajustesWizardInicializado === '1') return;
  root.dataset.ajustesWizardInicializado = '1';

  root.addEventListener('click', async (evento) => {
    const paso = evento.target.closest('[data-ajustes-wizard-go]')?.dataset.ajustesWizardGo;
    if (paso) {
      await irAPasoAjustes(paso);
      return;
    }
  });

  root.addEventListener('input', () => activarPasoAjustes(localStorage.getItem(STORAGE_AJUSTES_STEP) || 'activar', { guardar: false }));
  root.addEventListener('change', () => activarPasoAjustes(localStorage.getItem(STORAGE_AJUSTES_STEP) || 'activar', { guardar: false }));
  $('ajustesTestGemini')?.addEventListener('click', () => activarPasoAjustes('probar'));
  $('ajustesSaveGemini')?.addEventListener('click', () => {
    activarPasoAjustes('guardar');
    setMensaje('Configuración guardada localmente.', 'ok');
  });
  $('ajustesClearGemini')?.addEventListener('click', () => {
    activarPasoAjustes('clave');
    setMensaje('Clave eliminada de esta computadora.', 'ok');
  });

  activarPasoAjustes(localStorage.getItem(STORAGE_AJUSTES_STEP) || 'activar', { guardar: false });
}

export function inicializarAjustesWizardUI() {
  if (typeof document === 'undefined') return false;
  if (!inicializado) {
    inicializado = true;
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'ajustes') setTimeout(enlazarEventos, 0);
    });
  }
  enlazarEventos();
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarAjustesWizardUI);
}
