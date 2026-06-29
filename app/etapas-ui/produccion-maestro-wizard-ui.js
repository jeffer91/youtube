import { aplicarProcesoVisual } from '../procesos-ui/proceso-visual.service.js';

const STORAGE_PRODUCCION_STEP = 'autovideojeff.produccionMaestroPaso';
const STORAGE_PROYECTO_ETAPAS = 'autovideojeff.proyectoEtapasId';
const PASOS_PRODUCCION = ['cargar', 'preview', 'comparacion', 'problemas', 'adaptacion', 'avanzado'];
const MAPA_PASO_PROCESO = Object.freeze({
  cargar: 'cargar-producir',
  preview: 'preview',
  comparacion: 'comparacion',
  problemas: 'problemas',
  adaptacion: 'adaptacion',
  avanzado: 'timeline-auditoria'
});

let inicializado = false;

function $(id) { return document.getElementById(id); }

function tieneProyecto() {
  return Boolean($('produccionMaestroProyectoId')?.value?.trim() || localStorage.getItem(STORAGE_PROYECTO_ETAPAS));
}

function hayProduccionVisible() {
  const chip = $('produccionMaestroEstadoChip')?.textContent || '';
  const video = $('produccionMaestroVideo');
  const nombre = $('produccionMaestroNombre')?.textContent || '';
  const marcadores = $('produccionMaestroMarcadores')?.textContent || '0';
  return /producido|revisar|cargad/i.test(chip) || Boolean(video?.src) || (nombre && nombre !== '—') || Number(marcadores) > 0;
}

function comparacionDisponible() {
  return Boolean($('produccionMaestroAntes')?.src || $('produccionMaestroDespues')?.src || /disponible/i.test($('produccionMaestroComparacionEstado')?.textContent || ''));
}

function listoParaAdaptacion() {
  return !Boolean($('produccionMaestroAdaptarBtn')?.disabled);
}

function estadoPaso(paso, activo) {
  const proyecto = tieneProyecto();
  const produccion = hayProduccionVisible();
  const comparacion = comparacionDisponible();
  const adaptar = listoParaAdaptacion();
  if (paso === 'cargar') return activo === paso ? 'active' : proyecto || produccion ? 'done' : 'active';
  if (paso === 'preview') return !produccion ? 'locked' : activo === paso ? 'active' : 'done';
  if (paso === 'comparacion') return !produccion ? 'locked' : activo === paso ? 'active' : comparacion ? 'done' : 'active';
  if (paso === 'problemas') return !produccion ? 'locked' : activo === paso ? 'active' : 'done';
  if (paso === 'adaptacion') return !adaptar ? 'locked' : activo === paso ? 'active' : 'done';
  if (paso === 'avanzado') return activo === paso ? 'active' : 'advanced';
  return 'locked';
}

export function activarPasoProduccionMaestro(paso = 'cargar', { guardar = true } = {}) {
  const root = document.querySelector('[data-produccion-maestro-root]');
  if (!root) return false;
  const pasoFinal = PASOS_PRODUCCION.includes(paso) ? paso : 'cargar';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'cargar-producir';

  root.querySelectorAll('[data-produccion-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.produccionWizardPanel === pasoFinal;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });

  root.querySelectorAll('[data-produccion-wizard-go]').forEach((boton) => {
    const id = boton.dataset.produccionWizardGo;
    const estado = estadoPaso(id, pasoFinal);
    boton.classList.toggle('is-active', estado === 'active');
    boton.classList.toggle('is-done', estado === 'done');
    boton.classList.toggle('is-locked', estado === 'locked');
    boton.classList.toggle('is-advanced', estado === 'advanced');
  });

  aplicarProcesoVisual({ contenedor: root, procesoId: 'produccion-maestro', pasoActivoId: root.dataset.procesoPasoActivo });
  if (guardar) localStorage.setItem(STORAGE_PRODUCCION_STEP, pasoFinal);
  return true;
}

async function irAPasoProduccionMaestro(paso = 'cargar') {
  if (paso !== 'cargar' && paso !== 'avanzado' && !tieneProyecto()) {
    activarPasoProduccionMaestro('cargar');
    const box = $('produccionMaestroMensaje');
    if (box) {
      box.hidden = false;
      box.textContent = 'Primero carga o pega el ID del proyecto.';
      box.className = 'produccion-maestro-message is-warn';
    }
    return;
  }
  if (['preview', 'comparacion', 'problemas'].includes(paso) && !hayProduccionVisible()) {
    activarPasoProduccionMaestro('cargar');
    return;
  }
  if (paso === 'adaptacion' && !listoParaAdaptacion()) {
    activarPasoProduccionMaestro(hayProduccionVisible() ? 'problemas' : 'cargar');
    return;
  }
  activarPasoProduccionMaestro(paso);
}

function enlazarEventos() {
  const root = document.querySelector('[data-produccion-maestro-root]');
  if (!root || root.dataset.produccionWizardInicializado === '1') return;
  root.dataset.produccionWizardInicializado = '1';

  root.addEventListener('click', async (evento) => {
    const paso = evento.target.closest('[data-produccion-wizard-go]')?.dataset.produccionWizardGo;
    if (paso) {
      await irAPasoProduccionMaestro(paso);
      return;
    }
  });

  $('produccionMaestroCargarBtn')?.addEventListener('click', () => {
    activarPasoProduccionMaestro('cargar');
    setTimeout(() => activarPasoProduccionMaestro(hayProduccionVisible() ? 'preview' : 'cargar'), 800);
  });
  $('produccionMaestroProcesarBtn')?.addEventListener('click', () => {
    activarPasoProduccionMaestro('cargar');
    setTimeout(() => activarPasoProduccionMaestro(hayProduccionVisible() ? 'preview' : 'cargar'), 1000);
  });
  $('produccionMaestroAdaptarBtn')?.addEventListener('click', () => activarPasoProduccionMaestro('adaptacion'));

  const chip = $('produccionMaestroEstadoChip');
  if (chip) {
    const observer = new MutationObserver(() => {
      const actual = localStorage.getItem(STORAGE_PRODUCCION_STEP) || 'cargar';
      activarPasoProduccionMaestro(hayProduccionVisible() && actual === 'cargar' ? 'preview' : actual, { guardar: false });
    });
    observer.observe(chip, { childList: true, characterData: true, subtree: true });
  }

  activarPasoProduccionMaestro(localStorage.getItem(STORAGE_PRODUCCION_STEP) || 'cargar', { guardar: false });
}

export function inicializarProduccionMaestroWizardUI() {
  if (typeof document === 'undefined') return false;
  if (!inicializado) {
    inicializado = true;
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'produccion') setTimeout(enlazarEventos, 0);
    });
  }
  enlazarEventos();
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarProduccionMaestroWizardUI);
}
