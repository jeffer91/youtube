import { aplicarProcesoVisual } from '../procesos-ui/proceso-visual.service.js';

const STORAGE_ENTENDIMIENTO_STEP = 'autovideojeff.entendimientoPaso';
const PASOS_ENTENDIMIENTO = ['cargar', 'procesar', 'transcripcion', 'fotogramas', 'analisis', 'biblioteca', 'avanzado'];
const MAPA_PASO_PROCESO = Object.freeze({
  cargar: 'cargar-proyecto',
  procesar: 'procesar',
  transcripcion: 'transcripcion',
  fotogramas: 'fotogramas',
  analisis: 'analisis-global',
  biblioteca: 'pasar-biblioteca',
  avanzado: 'motores'
});

let inicializado = false;

function $(id) { return document.getElementById(id); }

function tieneProyecto() {
  return Boolean($('entendimientoProyectoId')?.value?.trim() || localStorage.getItem('autovideojeff.proyectoEtapasId'));
}

function hayResultadoVisible() {
  const transcripcion = $('entendimientoTranscripcion')?.textContent || '';
  const global = $('entendimientoGlobal')?.textContent || '';
  const estado = $('entendimientoEstadoChip')?.textContent || '';
  return /entendido|revisar|cargado|global/i.test(estado) || (!/carga un proyecto/i.test(transcripcion) && transcripcion.trim().length > 60) || (!/sin análisis global/i.test(global) && global.trim().length > 40);
}

function estaListoParaBiblioteca() {
  return !Boolean($('entendimientoCrearPlanBtn')?.disabled);
}

function estadoPaso(paso, pasoActivo) {
  const proyecto = tieneProyecto();
  const resultado = hayResultadoVisible();
  const listo = estaListoParaBiblioteca();
  if (paso === 'cargar') return pasoActivo === paso ? 'active' : proyecto || resultado ? 'done' : 'active';
  if (paso === 'procesar') return !proyecto ? 'locked' : pasoActivo === paso ? 'active' : resultado ? 'done' : 'active';
  if (['transcripcion', 'fotogramas', 'analisis'].includes(paso)) return !resultado ? 'locked' : pasoActivo === paso ? 'active' : 'done';
  if (paso === 'biblioteca') return !listo ? 'locked' : pasoActivo === paso ? 'active' : 'done';
  if (paso === 'avanzado') return pasoActivo === paso ? 'active' : 'advanced';
  return 'locked';
}

export function activarPasoEntendimiento(paso = 'cargar', { guardar = true } = {}) {
  const root = document.querySelector('[data-entendimiento-root]');
  if (!root) return false;
  const pasoFinal = PASOS_ENTENDIMIENTO.includes(paso) ? paso : 'cargar';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'cargar-proyecto';

  root.querySelectorAll('[data-entendimiento-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.entendimientoWizardPanel === pasoFinal;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });

  root.querySelectorAll('[data-entendimiento-wizard-go]').forEach((boton) => {
    const id = boton.dataset.entendimientoWizardGo;
    const estado = estadoPaso(id, pasoFinal);
    boton.classList.toggle('is-active', estado === 'active');
    boton.classList.toggle('is-done', estado === 'done');
    boton.classList.toggle('is-locked', estado === 'locked');
    boton.classList.toggle('is-advanced', estado === 'advanced');
  });

  aplicarProcesoVisual({ contenedor: root, procesoId: 'entendimiento', pasoActivoId: root.dataset.procesoPasoActivo });
  if (guardar) localStorage.setItem(STORAGE_ENTENDIMIENTO_STEP, pasoFinal);
  return true;
}

async function irAPasoEntendimiento(paso = 'cargar') {
  if (paso !== 'cargar' && paso !== 'avanzado' && !tieneProyecto()) {
    activarPasoEntendimiento('cargar');
    const box = $('entendimientoMensaje');
    if (box) {
      box.hidden = false;
      box.textContent = 'Primero carga o pega el ID del proyecto.';
      box.className = 'entendimiento-message is-warn';
    }
    return;
  }
  if (['transcripcion', 'fotogramas', 'analisis'].includes(paso) && !hayResultadoVisible()) {
    activarPasoEntendimiento('procesar');
    return;
  }
  if (paso === 'biblioteca' && !estaListoParaBiblioteca()) {
    activarPasoEntendimiento(hayResultadoVisible() ? 'analisis' : 'procesar');
    return;
  }
  activarPasoEntendimiento(paso);
}

function enlazarEventos() {
  const root = document.querySelector('[data-entendimiento-root]');
  if (!root || root.dataset.entendimientoWizardInicializado === '1') return;
  root.dataset.entendimientoWizardInicializado = '1';

  root.addEventListener('click', async (evento) => {
    const paso = evento.target.closest('[data-entendimiento-wizard-go]')?.dataset.entendimientoWizardGo;
    if (paso) {
      await irAPasoEntendimiento(paso);
      return;
    }
    const accion = evento.target.closest('[data-entendimiento-action]')?.dataset.entendimientoAction;
    if (accion === 'procesar') $('entendimientoProcesarBtn')?.click();
  });

  $('entendimientoCargarBtn')?.addEventListener('click', () => {
    setTimeout(() => activarPasoEntendimiento(hayResultadoVisible() ? 'transcripcion' : 'procesar'), 700);
  });
  $('entendimientoProcesarBtn')?.addEventListener('click', () => {
    activarPasoEntendimiento('procesar');
    setTimeout(() => activarPasoEntendimiento(hayResultadoVisible() ? 'transcripcion' : 'procesar'), 900);
  });
  $('entendimientoDiagnosticarMotoresBtn')?.addEventListener('click', () => activarPasoEntendimiento('avanzado'));
  $('entendimientoInstalarMotoresBtn')?.addEventListener('click', () => activarPasoEntendimiento('avanzado'));

  const chip = $('entendimientoEstadoChip');
  if (chip) {
    const observer = new MutationObserver(() => {
      const actual = localStorage.getItem(STORAGE_ENTENDIMIENTO_STEP) || 'cargar';
      activarPasoEntendimiento(hayResultadoVisible() && ['cargar', 'procesar'].includes(actual) ? 'transcripcion' : actual, { guardar: false });
    });
    observer.observe(chip, { childList: true, characterData: true, subtree: true });
  }

  activarPasoEntendimiento(localStorage.getItem(STORAGE_ENTENDIMIENTO_STEP) || 'cargar', { guardar: false });
}

export function inicializarEntendimientoWizardUI() {
  if (typeof document === 'undefined') return false;
  if (!inicializado) {
    inicializado = true;
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'entendimiento') setTimeout(enlazarEventos, 0);
    });
  }
  enlazarEventos();
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarEntendimientoWizardUI);
}
