import { aplicarProcesoVisual } from '../procesos-ui/proceso-visual.service.js';

const STORAGE_PLAN_STEP = 'autovideojeff.planEdicionPaso';
const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';
const PASOS_PLAN = ['cargar', 'resumen', 'elementos', 'timeline', 'aprobar', 'producir', 'avanzado'];
const MAPA_PASO_PROCESO = Object.freeze({
  cargar: 'cargar-crear',
  resumen: 'resumen',
  elementos: 'elementos',
  timeline: 'timeline',
  aprobar: 'aprobar',
  producir: 'producir',
  avanzado: 'detalles-tecnicos'
});

let inicializado = false;

function $(id) { return document.getElementById(id); }

function tieneProyecto() {
  return Boolean($('planProyectoId')?.value?.trim() || localStorage.getItem(STORAGE_PROYECTO_ETAPAS));
}

function hayPlanVisible() {
  const chip = $('planEstadoChip')?.textContent || '';
  const lectura = $('planLectura')?.textContent || '';
  const elementos = $('planElementosEstado')?.textContent || '0';
  return /listo|aprobado|revisar|cargado/i.test(chip) || (!/carga o crea el plan/i.test(lectura) && lectura.trim().length > 40) || Number(elementos) > 0;
}

function planAprobado() {
  const editor = $('planEditor')?.textContent || '';
  const chip = $('planEstadoChip')?.textContent || '';
  return /aprobado|listo/i.test(editor) || /listo para producir|plan aprobado/i.test(chip);
}

function puedeProducir() {
  return !Boolean($('planProducirBtn')?.disabled);
}

function estadoPaso(paso, activo) {
  const proyecto = tieneProyecto();
  const plan = hayPlanVisible();
  const aprobado = planAprobado();
  const producir = puedeProducir();
  if (paso === 'cargar') return activo === paso ? 'active' : proyecto || plan ? 'done' : 'active';
  if (paso === 'resumen') return !plan ? 'locked' : activo === paso ? 'active' : 'done';
  if (['elementos', 'timeline'].includes(paso)) return !plan ? 'locked' : activo === paso ? 'active' : 'done';
  if (paso === 'aprobar') return !plan ? 'locked' : activo === paso ? 'active' : aprobado ? 'done' : 'active';
  if (paso === 'producir') return !producir ? 'locked' : activo === paso ? 'active' : 'done';
  if (paso === 'avanzado') return activo === paso ? 'active' : 'advanced';
  return 'locked';
}

export function activarPasoPlanEdicion(paso = 'cargar', { guardar = true } = {}) {
  const root = document.querySelector('[data-plan-root]');
  if (!root) return false;
  const pasoFinal = PASOS_PLAN.includes(paso) ? paso : 'cargar';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'cargar-crear';

  root.querySelectorAll('[data-plan-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.planWizardPanel === pasoFinal;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });

  root.querySelectorAll('[data-plan-wizard-go]').forEach((boton) => {
    const id = boton.dataset.planWizardGo;
    const estado = estadoPaso(id, pasoFinal);
    boton.classList.toggle('is-active', estado === 'active');
    boton.classList.toggle('is-done', estado === 'done');
    boton.classList.toggle('is-locked', estado === 'locked');
    boton.classList.toggle('is-advanced', estado === 'advanced');
  });

  aplicarProcesoVisual({ contenedor: root, procesoId: 'plan-edicion', pasoActivoId: root.dataset.procesoPasoActivo });
  if (guardar) localStorage.setItem(STORAGE_PLAN_STEP, pasoFinal);
  return true;
}

async function irAPasoPlanEdicion(paso = 'cargar') {
  if (paso !== 'cargar' && paso !== 'avanzado' && !tieneProyecto()) {
    activarPasoPlanEdicion('cargar');
    const box = $('planMensaje');
    if (box) {
      box.hidden = false;
      box.textContent = 'Primero carga o pega el ID del proyecto.';
      box.className = 'plan-message is-warn';
    }
    return;
  }
  if (['resumen', 'elementos', 'timeline', 'aprobar'].includes(paso) && !hayPlanVisible()) {
    activarPasoPlanEdicion('cargar');
    return;
  }
  if (paso === 'producir' && !puedeProducir()) {
    activarPasoPlanEdicion(planAprobado() ? 'aprobar' : 'aprobar');
    return;
  }
  activarPasoPlanEdicion(paso);
}

function enlazarEventos() {
  const root = document.querySelector('[data-plan-root]');
  if (!root || root.dataset.planWizardInicializado === '1') return;
  root.dataset.planWizardInicializado = '1';

  root.addEventListener('click', async (evento) => {
    const paso = evento.target.closest('[data-plan-wizard-go]')?.dataset.planWizardGo;
    if (paso) {
      await irAPasoPlanEdicion(paso);
      return;
    }
  });

  $('planCargarBtn')?.addEventListener('click', () => {
    activarPasoPlanEdicion('cargar');
    setTimeout(() => activarPasoPlanEdicion(hayPlanVisible() ? 'resumen' : 'cargar'), 700);
  });
  $('planProcesarBtn')?.addEventListener('click', () => {
    activarPasoPlanEdicion('cargar');
    setTimeout(() => activarPasoPlanEdicion(hayPlanVisible() ? 'resumen' : 'cargar'), 900);
  });
  $('planAprobarBtn')?.addEventListener('click', () => {
    activarPasoPlanEdicion('aprobar');
    setTimeout(() => activarPasoPlanEdicion(puedeProducir() ? 'producir' : 'aprobar'), 800);
  });
  $('planProducirBtn')?.addEventListener('click', () => activarPasoPlanEdicion('producir'));

  const chip = $('planEstadoChip');
  if (chip) {
    const observer = new MutationObserver(() => {
      const actual = localStorage.getItem(STORAGE_PLAN_STEP) || 'cargar';
      activarPasoPlanEdicion(hayPlanVisible() && actual === 'cargar' ? 'resumen' : actual, { guardar: false });
    });
    observer.observe(chip, { childList: true, characterData: true, subtree: true });
  }

  activarPasoPlanEdicion(localStorage.getItem(STORAGE_PLAN_STEP) || 'cargar', { guardar: false });
}

export function inicializarPlanEdicionWizardUI() {
  if (typeof document === 'undefined') return false;
  if (!inicializado) {
    inicializado = true;
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'plan-edicion') setTimeout(enlazarEventos, 0);
    });
  }
  enlazarEventos();
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarPlanEdicionWizardUI);
}
