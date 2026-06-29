import { PERFILES } from './pantallas/perfiles.view.js';
import { aplicarProcesoVisual } from './procesos-ui/proceso-visual.service.js';

const STORAGE_PERFILES_STEP = 'autovideojeff.perfilesPaso';
const STORAGE_PERFIL_ACTIVO = 'autovideojeff.perfilActivo';
const PASOS_PERFILES = ['elegir', 'ritmo', 'textos', 'visual', 'uso'];
const MAPA_PASO_PROCESO = Object.freeze({
  elegir: 'elegir',
  ritmo: 'ritmo',
  textos: 'textos',
  visual: 'visual',
  uso: 'uso'
});

let perfilSeleccionado = null;
let inicializado = false;

function $(id) { return document.getElementById(id); }

function escapar(valor = '') {
  return String(valor ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function obtenerPerfil(id = '') {
  return PERFILES.find((perfil) => perfil.id === id) || PERFILES.find((perfil) => perfil.id === 'general') || PERFILES[0];
}

function setChip(texto = 'Sin perfil seleccionado', tipo = 'normal') {
  const chip = $('profilesStateChip');
  if (!chip) return;
  chip.textContent = texto;
  chip.className = `aj-status-chip profiles-chip is-${tipo}`;
}

function setMensaje(mensaje = '', tipo = 'normal') {
  const box = $('profilesMessage');
  if (!box) return;
  box.hidden = !mensaje;
  box.textContent = mensaje;
  box.className = `profiles-message is-${tipo}`;
}

function renderDetalle(campo, titulo) {
  if (!perfilSeleccionado) return '<div class="profiles-empty">Selecciona un perfil para ver este detalle.</div>';
  return `
    <article class="profiles-selected-card">
      <header><div><span>Perfil seleccionado</span><strong>${escapar(perfilSeleccionado.nombre)}</strong></div><small>${escapar(perfilSeleccionado.id)}</small></header>
      <dl>
        <div><dt>${escapar(titulo)}</dt><dd>${escapar(perfilSeleccionado[campo])}</dd></div>
      </dl>
      <footer>
        <button class="profiles-mini-button" type="button" data-perfiles-wizard-go="elegir">Cambiar perfil</button>
        <button class="profiles-mini-button is-primary" type="button" data-perfiles-next>Continuar</button>
      </footer>
    </article>
  `;
}

function actualizarDetalles() {
  const ritmo = $('profileRitmoDetail');
  const textos = $('profileTextosDetail');
  const visual = $('profileVisualDetail');
  const uso = $('profileUsoDetail');
  if (ritmo) ritmo.innerHTML = renderDetalle('ritmo', 'Ritmo');
  if (textos) textos.innerHTML = renderDetalle('textos', 'Textos');
  if (visual) visual.innerHTML = renderDetalle('visual', 'Visual');
  if (uso) uso.innerHTML = renderDetalle('uso', 'Uso ideal');
}

function actualizarTarjetas() {
  document.querySelectorAll('[data-profile-style]').forEach((card) => {
    const activo = perfilSeleccionado?.id && card.dataset.profileStyle === perfilSeleccionado.id;
    card.classList.toggle('is-selected', Boolean(activo));
  });
}

function estadoPaso(paso, activo) {
  const seleccionado = Boolean(perfilSeleccionado);
  if (paso === 'elegir') return activo === paso ? 'active' : seleccionado ? 'done' : 'active';
  if (!seleccionado) return 'locked';
  return activo === paso ? 'active' : 'done';
}

export function activarPasoPerfiles(paso = 'elegir', { guardar = true } = {}) {
  const root = document.querySelector('[data-perfiles-root]');
  if (!root) return false;
  const pasoFinal = PASOS_PERFILES.includes(paso) ? paso : 'elegir';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'elegir';

  root.querySelectorAll('[data-perfiles-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.perfilesWizardPanel === pasoFinal;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });

  root.querySelectorAll('[data-perfiles-wizard-go]').forEach((boton) => {
    const id = boton.dataset.perfilesWizardGo;
    const estado = estadoPaso(id, pasoFinal);
    boton.classList.toggle('is-active', estado === 'active');
    boton.classList.toggle('is-done', estado === 'done');
    boton.classList.toggle('is-locked', estado === 'locked');
  });

  aplicarProcesoVisual({ contenedor: root, procesoId: 'perfiles', pasoActivoId: root.dataset.procesoPasoActivo });
  if (guardar) localStorage.setItem(STORAGE_PERFILES_STEP, pasoFinal);
  return true;
}

function siguientePaso(paso = localStorage.getItem(STORAGE_PERFILES_STEP) || 'elegir') {
  const indice = PASOS_PERFILES.indexOf(paso);
  if (indice < 0) return 'ritmo';
  return PASOS_PERFILES[Math.min(indice + 1, PASOS_PERFILES.length - 1)] || 'uso';
}

function seleccionarPerfil(id) {
  perfilSeleccionado = obtenerPerfil(id);
  localStorage.setItem(STORAGE_PERFIL_ACTIVO, perfilSeleccionado.id);
  setChip(`Perfil: ${perfilSeleccionado.nombre}`, 'ok');
  setMensaje(`Perfil ${perfilSeleccionado.nombre} seleccionado. Ahora revisa el ritmo.`, 'ok');
  actualizarTarjetas();
  actualizarDetalles();
  activarPasoPerfiles('ritmo');
}

async function irAPasoPerfiles(paso = 'elegir') {
  if (paso !== 'elegir' && !perfilSeleccionado) {
    setMensaje('Primero selecciona un perfil editorial.', 'warn');
    activarPasoPerfiles('elegir');
    return;
  }
  activarPasoPerfiles(paso);
}

function enlazarEventos() {
  const root = document.querySelector('[data-perfiles-root]');
  if (!root || root.dataset.perfilesInicializado === '1') return;
  root.dataset.perfilesInicializado = '1';

  const guardado = localStorage.getItem(STORAGE_PERFIL_ACTIVO);
  if (guardado) {
    perfilSeleccionado = obtenerPerfil(guardado);
    setChip(`Perfil: ${perfilSeleccionado.nombre}`, 'ok');
    actualizarTarjetas();
    actualizarDetalles();
  }

  root.addEventListener('click', async (evento) => {
    const perfilId = evento.target.closest('[data-profile-select]')?.dataset.profileSelect;
    if (perfilId) {
      seleccionarPerfil(perfilId);
      return;
    }
    const paso = evento.target.closest('[data-perfiles-wizard-go]')?.dataset.perfilesWizardGo;
    if (paso) {
      await irAPasoPerfiles(paso);
      return;
    }
    if (evento.target.closest('[data-perfiles-next]')) {
      await irAPasoPerfiles(siguientePaso(localStorage.getItem(STORAGE_PERFILES_STEP) || 'ritmo'));
    }
  });

  activarPasoPerfiles(localStorage.getItem(STORAGE_PERFILES_STEP) || 'elegir', { guardar: false });
}

export function inicializarPerfilesUI() {
  if (typeof document === 'undefined') return false;
  if (!inicializado) {
    inicializado = true;
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'perfiles') setTimeout(enlazarEventos, 0);
    });
  }
  enlazarEventos();
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarPerfilesUI);
}
