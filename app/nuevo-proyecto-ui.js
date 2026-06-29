import { aplicarProcesoVisual } from './procesos-ui/proceso-visual.service.js';

const STORAGE_NUEVO_PROYECTO_STEP = 'autovideojeff.nuevoProyectoPaso';
const PASOS_NUEVO_PROYECTO = ['nombre', 'subir-video', 'procesar', 'tecnico'];
const MAPA_PASO_PROCESO = Object.freeze({
  nombre: 'nombre',
  'subir-video': 'subir-video',
  procesar: 'procesar-entendimiento',
  tecnico: 'opciones-tecnicas'
});

let inicializado = false;

function $(id) { return document.getElementById(id); }

function tieneNombre() {
  return Boolean($('projectNameInput')?.value?.trim());
}

function tieneVideo() {
  return Boolean($('videoInput')?.files?.length);
}

function estaProcesando() {
  const progreso = $('progressArea');
  return Boolean(progreso && !progreso.hidden);
}

function setMensaje(texto = '', tipo = 'normal') {
  const box = $('nuevoProyectoMensaje');
  if (!box) return;
  box.hidden = !texto;
  box.textContent = texto;
  box.className = `clean-project-message is-${tipo}`;
}

function estadoPaso(paso, activo) {
  const nombre = tieneNombre();
  const video = tieneVideo();
  if (paso === 'nombre') return activo === paso ? 'active' : nombre ? 'done' : 'active';
  if (paso === 'subir-video') return !nombre ? 'locked' : activo === paso ? 'active' : video ? 'done' : 'active';
  if (paso === 'procesar') return !nombre || !video ? 'locked' : activo === paso ? 'active' : estaProcesando() ? 'done' : 'active';
  if (paso === 'tecnico') return activo === paso ? 'active' : 'advanced';
  return 'locked';
}

function marcarZonaActiva(pasoFinal) {
  document.querySelectorAll('[data-nuevo-project-zone]').forEach((zona) => {
    const id = zona.dataset.nuevoProjectZone;
    zona.classList.toggle('is-current-zone', id === pasoFinal || (pasoFinal === 'procesar' && id === 'procesar'));
    zona.classList.toggle('is-soft-zone', id !== pasoFinal && id !== 'tecnico');
  });
}

export function activarPasoNuevoProyecto(paso = 'nombre', { guardar = true } = {}) {
  const root = document.querySelector('[data-nuevo-proyecto-root]');
  if (!root) return false;
  const pasoFinal = PASOS_NUEVO_PROYECTO.includes(paso) ? paso : 'nombre';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'nombre';

  root.querySelectorAll('[data-nuevo-wizard-go]').forEach((boton) => {
    const id = boton.dataset.nuevoWizardGo;
    const estado = estadoPaso(id, pasoFinal);
    boton.classList.toggle('is-active', estado === 'active');
    boton.classList.toggle('is-done', estado === 'done');
    boton.classList.toggle('is-locked', estado === 'locked');
    boton.classList.toggle('is-advanced', estado === 'advanced');
  });

  marcarZonaActiva(pasoFinal);
  aplicarProcesoVisual({ contenedor: root, procesoId: 'nuevo-proyecto', pasoActivoId: root.dataset.procesoPasoActivo });
  if (guardar) localStorage.setItem(STORAGE_NUEVO_PROYECTO_STEP, pasoFinal);
  return true;
}

async function irAPasoNuevoProyecto(paso = 'nombre') {
  if (paso === 'subir-video' && !tieneNombre()) {
    setMensaje('Primero escribe el nombre del proyecto.', 'warn');
    activarPasoNuevoProyecto('nombre');
    $('projectNameInput')?.focus();
    return;
  }
  if (paso === 'procesar' && (!tieneNombre() || !tieneVideo())) {
    setMensaje(!tieneNombre() ? 'Primero escribe el nombre del proyecto.' : 'Primero sube al menos un video.', 'warn');
    activarPasoNuevoProyecto(!tieneNombre() ? 'nombre' : 'subir-video');
    return;
  }
  setMensaje('', 'normal');
  activarPasoNuevoProyecto(paso);
}

function enlazarEventos() {
  const root = document.querySelector('[data-nuevo-proyecto-root]');
  if (!root || root.dataset.nuevoProyectoWizardInicializado === '1') return;
  root.dataset.nuevoProyectoWizardInicializado = '1';

  root.addEventListener('click', async (evento) => {
    const paso = evento.target.closest('[data-nuevo-wizard-go]')?.dataset.nuevoWizardGo;
    if (paso) {
      await irAPasoNuevoProyecto(paso);
      return;
    }
  });

  $('projectNameInput')?.addEventListener('input', () => {
    if (tieneNombre() && localStorage.getItem(STORAGE_NUEVO_PROYECTO_STEP) === 'nombre') activarPasoNuevoProyecto('subir-video');
    else activarPasoNuevoProyecto(localStorage.getItem(STORAGE_NUEVO_PROYECTO_STEP) || 'nombre', { guardar: false });
  });

  $('videoInput')?.addEventListener('change', () => {
    if (tieneVideo()) activarPasoNuevoProyecto('procesar');
    else activarPasoNuevoProyecto(tieneNombre() ? 'subir-video' : 'nombre');
  });

  $('processButton')?.addEventListener('click', () => {
    if (tieneNombre() && tieneVideo()) activarPasoNuevoProyecto('procesar');
  });

  const progreso = $('progressArea');
  if (progreso) {
    const observer = new MutationObserver(() => activarPasoNuevoProyecto(localStorage.getItem(STORAGE_NUEVO_PROYECTO_STEP) || 'procesar', { guardar: false }));
    observer.observe(progreso, { attributes: true, attributeFilter: ['hidden'] });
  }

  const pasoInicial = tieneVideo() ? 'procesar' : tieneNombre() ? 'subir-video' : localStorage.getItem(STORAGE_NUEVO_PROYECTO_STEP) || 'nombre';
  activarPasoNuevoProyecto(pasoInicial, { guardar: false });
}

export function inicializarNuevoProyectoUI() {
  if (typeof document === 'undefined') return false;
  if (!inicializado) {
    inicializado = true;
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'nuevo-proyecto') setTimeout(enlazarEventos, 0);
    });
  }
  enlazarEventos();
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarNuevoProyectoUI);
}
