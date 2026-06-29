import { aplicarProcesoVisual } from './procesos-ui/proceso-visual.service.js';

const STORAGE_RESULTADO_STEP = 'autovideojeff.resultadoFinalPaso';
const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';
const PASOS_RESULTADO = ['cargar', 'maestro', 'versiones', 'checklist', 'reporte'];
const MAPA_PASO_PROCESO = Object.freeze({
  cargar: 'cargar-generar',
  maestro: 'maestro',
  versiones: 'versiones',
  checklist: 'checklist',
  reporte: 'reporte'
});

let inicializado = false;

function $(id) { return document.getElementById(id); }

function tieneProyecto() {
  return Boolean($('resultadoFinalProyectoId')?.value?.trim() || localStorage.getItem(STORAGE_PROYECTO_ETAPAS));
}

function hayResultadoVisible() {
  const chip = $('resultadoFinalEstadoChip')?.textContent || '';
  const status = $('resultadoFinalStatus')?.textContent || '';
  const plataformas = $('resultadoFinalPlataformas')?.textContent || '0/0';
  const checklist = $('resultadoFinalChecklistEstado')?.textContent || '0';
  const reporte = $('resultadoFinalReporteEstado')?.textContent || '0';
  return /finalizado|revisar|cargado/i.test(chip) || /listo|pendientes/i.test(status) || plataformas !== '—' && plataformas !== '0/0' || Number(checklist) > 0 || Number(reporte) > 0;
}

function tieneVideoMaestro() {
  const video = $('resultadoFinalVideo');
  const estado = $('resultadoFinalVideoEstado')?.textContent || '';
  return Boolean(video?.src) || /disponible/i.test(estado);
}

function estadoPaso(paso, activo) {
  const proyecto = tieneProyecto();
  const resultado = hayResultadoVisible();
  const maestro = tieneVideoMaestro();
  if (paso === 'cargar') return activo === paso ? 'active' : proyecto || resultado ? 'done' : 'active';
  if (paso === 'maestro') return !resultado ? 'locked' : activo === paso ? 'active' : maestro ? 'done' : 'active';
  if (['versiones', 'checklist', 'reporte'].includes(paso)) return !resultado ? 'locked' : activo === paso ? 'active' : 'done';
  return 'locked';
}

export function activarPasoResultadoFinal(paso = 'cargar', { guardar = true } = {}) {
  const root = document.querySelector('[data-resultado-final-root]');
  if (!root) return false;
  const pasoFinal = PASOS_RESULTADO.includes(paso) ? paso : 'cargar';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'cargar-generar';

  root.querySelectorAll('[data-resultado-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.resultadoWizardPanel === pasoFinal;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });

  root.querySelectorAll('[data-resultado-wizard-go]').forEach((boton) => {
    const id = boton.dataset.resultadoWizardGo;
    const estado = estadoPaso(id, pasoFinal);
    boton.classList.toggle('is-active', estado === 'active');
    boton.classList.toggle('is-done', estado === 'done');
    boton.classList.toggle('is-locked', estado === 'locked');
  });

  aplicarProcesoVisual({ contenedor: root, procesoId: 'resultado-final', pasoActivoId: root.dataset.procesoPasoActivo });
  if (guardar) localStorage.setItem(STORAGE_RESULTADO_STEP, pasoFinal);
  return true;
}

async function irAPasoResultadoFinal(paso = 'cargar') {
  if (paso !== 'cargar' && !tieneProyecto()) {
    activarPasoResultadoFinal('cargar');
    const box = $('resultadoFinalMensaje');
    if (box) {
      box.hidden = false;
      box.textContent = 'Primero carga o pega el ID del proyecto.';
      box.className = 'result-final-message is-warn';
    }
    return;
  }
  if (['maestro', 'versiones', 'checklist', 'reporte'].includes(paso) && !hayResultadoVisible()) {
    activarPasoResultadoFinal('cargar');
    return;
  }
  activarPasoResultadoFinal(paso);
}

function enlazarEventos() {
  const root = document.querySelector('[data-resultado-final-root]');
  if (!root || root.dataset.resultadoWizardInicializado === '1') return;
  root.dataset.resultadoWizardInicializado = '1';

  root.addEventListener('click', async (evento) => {
    const paso = evento.target.closest('[data-resultado-wizard-go]')?.dataset.resultadoWizardGo;
    if (paso) {
      await irAPasoResultadoFinal(paso);
      return;
    }
  });

  $('resultadoFinalCargarBtn')?.addEventListener('click', () => {
    activarPasoResultadoFinal('cargar');
    setTimeout(() => activarPasoResultadoFinal(hayResultadoVisible() ? 'maestro' : 'cargar'), 800);
  });
  $('resultadoFinalGenerarBtn')?.addEventListener('click', () => {
    activarPasoResultadoFinal('cargar');
    setTimeout(() => activarPasoResultadoFinal(hayResultadoVisible() ? 'maestro' : 'cargar'), 1000);
  });

  const chip = $('resultadoFinalEstadoChip');
  if (chip) {
    const observer = new MutationObserver(() => {
      const actual = localStorage.getItem(STORAGE_RESULTADO_STEP) || 'cargar';
      activarPasoResultadoFinal(hayResultadoVisible() && actual === 'cargar' ? 'maestro' : actual, { guardar: false });
    });
    observer.observe(chip, { childList: true, characterData: true, subtree: true });
  }

  activarPasoResultadoFinal(localStorage.getItem(STORAGE_RESULTADO_STEP) || 'cargar', { guardar: false });
}

export function inicializarResultadoFinalWizardUI() {
  if (typeof document === 'undefined') return false;
  if (!inicializado) {
    inicializado = true;
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'resultado') setTimeout(enlazarEventos, 0);
    });
  }
  enlazarEventos();
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarResultadoFinalWizardUI);
}
