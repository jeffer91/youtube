import { aplicarProcesoVisual } from '../procesos-ui/proceso-visual.service.js';

const STORAGE_ADAPTACION_STEP = 'autovideojeff.adaptacionPaso';
const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';
const PASOS_ADAPTACION = ['cargar', 'plataformas', 'adaptar', 'versiones', 'resultado', 'avanzado'];
const MAPA_PASO_PROCESO = Object.freeze({
  cargar: 'cargar-proyecto',
  plataformas: 'plataformas',
  adaptar: 'adaptar',
  versiones: 'revisar-versiones',
  resultado: 'resultado-final',
  avanzado: 'opciones-avanzadas'
});

let inicializado = false;

function $(id) { return document.getElementById(id); }

function tieneProyecto() {
  return Boolean($('adaptacionProyectoId')?.value?.trim() || localStorage.getItem(STORAGE_PROYECTO_ETAPAS));
}

function hayPlataformasSeleccionadas() {
  const checks = [...document.querySelectorAll('input[name="adaptacionPlataforma"]')];
  return checks.some((check) => check.checked);
}

function hayAdaptacionVisible() {
  const chip = $('adaptacionEstadoChip')?.textContent || '';
  const total = $('adaptacionTotal')?.textContent || '0';
  const plataformas = $('adaptacionPlataformasEstado')?.textContent || '0';
  return /adaptado|revisar|cargad/i.test(chip) || Number(total) > 0 || Number(plataformas) > 0;
}

function listoParaResultado() {
  return !Boolean($('adaptacionResultadoBtn')?.disabled);
}

function estadoPaso(paso, activo) {
  const proyecto = tieneProyecto();
  const seleccion = hayPlataformasSeleccionadas();
  const adaptacion = hayAdaptacionVisible();
  const resultado = listoParaResultado();
  if (paso === 'cargar') return activo === paso ? 'active' : proyecto || adaptacion ? 'done' : 'active';
  if (paso === 'plataformas') return !proyecto ? 'locked' : activo === paso ? 'active' : seleccion ? 'done' : 'active';
  if (paso === 'adaptar') return !proyecto || !seleccion ? 'locked' : activo === paso ? 'active' : adaptacion ? 'done' : 'active';
  if (paso === 'versiones') return !adaptacion ? 'locked' : activo === paso ? 'active' : 'done';
  if (paso === 'resultado') return !resultado ? 'locked' : activo === paso ? 'active' : 'done';
  if (paso === 'avanzado') return activo === paso ? 'active' : 'advanced';
  return 'locked';
}

export function activarPasoAdaptacion(paso = 'cargar', { guardar = true } = {}) {
  const root = document.querySelector('[data-adaptacion-root]');
  if (!root) return false;
  const pasoFinal = PASOS_ADAPTACION.includes(paso) ? paso : 'cargar';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'cargar-proyecto';

  root.querySelectorAll('[data-adaptacion-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.adaptacionWizardPanel === pasoFinal;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });

  root.querySelectorAll('[data-adaptacion-wizard-go]').forEach((boton) => {
    const id = boton.dataset.adaptacionWizardGo;
    const estado = estadoPaso(id, pasoFinal);
    boton.classList.toggle('is-active', estado === 'active');
    boton.classList.toggle('is-done', estado === 'done');
    boton.classList.toggle('is-locked', estado === 'locked');
    boton.classList.toggle('is-advanced', estado === 'advanced');
  });

  aplicarProcesoVisual({ contenedor: root, procesoId: 'adaptacion', pasoActivoId: root.dataset.procesoPasoActivo });
  if (guardar) localStorage.setItem(STORAGE_ADAPTACION_STEP, pasoFinal);
  return true;
}

async function irAPasoAdaptacion(paso = 'cargar') {
  if (paso !== 'cargar' && paso !== 'avanzado' && !tieneProyecto()) {
    activarPasoAdaptacion('cargar');
    const box = $('adaptacionMensaje');
    if (box) {
      box.hidden = false;
      box.textContent = 'Primero carga o pega el ID del proyecto.';
      box.className = 'adaptacion-message is-warn';
    }
    return;
  }
  if (paso === 'adaptar' && !hayPlataformasSeleccionadas()) {
    activarPasoAdaptacion('plataformas');
    return;
  }
  if (paso === 'versiones' && !hayAdaptacionVisible()) {
    activarPasoAdaptacion('adaptar');
    return;
  }
  if (paso === 'resultado' && !listoParaResultado()) {
    activarPasoAdaptacion(hayAdaptacionVisible() ? 'versiones' : 'adaptar');
    return;
  }
  activarPasoAdaptacion(paso);
}

function enlazarEventos() {
  const root = document.querySelector('[data-adaptacion-root]');
  if (!root || root.dataset.adaptacionWizardInicializado === '1') return;
  root.dataset.adaptacionWizardInicializado = '1';

  root.addEventListener('click', async (evento) => {
    const paso = evento.target.closest('[data-adaptacion-wizard-go]')?.dataset.adaptacionWizardGo;
    if (paso) {
      await irAPasoAdaptacion(paso);
      return;
    }
  });

  root.addEventListener('change', (evento) => {
    if (evento.target?.name === 'adaptacionPlataforma' || evento.target?.id === 'adaptacionRenderBaseOtraVez') {
      const actual = localStorage.getItem(STORAGE_ADAPTACION_STEP) || 'plataformas';
      activarPasoAdaptacion(actual, { guardar: false });
    }
  });

  $('adaptacionCargarBtn')?.addEventListener('click', () => {
    activarPasoAdaptacion('cargar');
    setTimeout(() => activarPasoAdaptacion(hayAdaptacionVisible() ? 'versiones' : 'plataformas'), 800);
  });
  $('adaptacionProcesarBtn')?.addEventListener('click', () => {
    activarPasoAdaptacion('adaptar');
    setTimeout(() => activarPasoAdaptacion(hayAdaptacionVisible() ? 'versiones' : 'adaptar'), 1000);
  });
  $('adaptacionResultadoBtn')?.addEventListener('click', () => activarPasoAdaptacion('resultado'));

  const chip = $('adaptacionEstadoChip');
  if (chip) {
    const observer = new MutationObserver(() => {
      const actual = localStorage.getItem(STORAGE_ADAPTACION_STEP) || 'cargar';
      activarPasoAdaptacion(hayAdaptacionVisible() && ['cargar', 'adaptar'].includes(actual) ? 'versiones' : actual, { guardar: false });
    });
    observer.observe(chip, { childList: true, characterData: true, subtree: true });
  }

  activarPasoAdaptacion(localStorage.getItem(STORAGE_ADAPTACION_STEP) || 'cargar', { guardar: false });
}

export function inicializarAdaptacionWizardUI() {
  if (typeof document === 'undefined') return false;
  if (!inicializado) {
    inicializado = true;
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'adaptacion') setTimeout(enlazarEventos, 0);
    });
  }
  enlazarEventos();
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarAdaptacionWizardUI);
}
