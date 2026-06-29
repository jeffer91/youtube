import { aplicarProcesoVisual } from './procesos-ui/proceso-visual.service.js';

const STORAGE_INICIO_STEP = 'autovideojeff.inicioPaso';
const PASOS_INICIO = ['estado', 'accesos', 'servidor', 'diagnostico'];
const MAPA_PASO_PROCESO = Object.freeze({
  estado: 'estado-general',
  accesos: 'accesos-rapidos',
  servidor: 'servidor-local',
  diagnostico: 'diagnostico-rapido'
});

let inicializado = false;

function $(id) { return document.getElementById(id); }

function setChip(texto = 'Sistema listo', tipo = 'ok') {
  const chip = $('inicioStateChip');
  if (!chip) return;
  chip.textContent = texto;
  chip.className = `aj-status-chip inicio-chip is-${tipo}`;
}

function setMensaje(texto = '', tipo = 'normal') {
  const box = $('inicioMessage');
  if (!box) return;
  box.hidden = !texto;
  box.textContent = texto;
  box.className = `inicio-message is-${tipo}`;
}

function estadoPaso(paso, activo) {
  if (paso === activo) return 'active';
  if (paso === 'diagnostico') return 'advanced';
  return 'done';
}

export function activarPasoInicio(paso = 'estado', { guardar = true } = {}) {
  const root = document.querySelector('[data-inicio-root]');
  if (!root) return false;
  const pasoFinal = PASOS_INICIO.includes(paso) ? paso : 'estado';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'estado-general';

  root.querySelectorAll('[data-inicio-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.inicioWizardPanel === pasoFinal;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });

  root.querySelectorAll('[data-inicio-wizard-go]').forEach((boton) => {
    const id = boton.dataset.inicioWizardGo;
    const estado = estadoPaso(id, pasoFinal);
    boton.classList.toggle('is-active', estado === 'active');
    boton.classList.toggle('is-done', estado === 'done');
    boton.classList.toggle('is-advanced', estado === 'advanced');
  });

  aplicarProcesoVisual({ contenedor: root, procesoId: 'inicio', pasoActivoId: root.dataset.procesoPasoActivo });
  setChip(pasoFinal === 'diagnostico' ? 'Diagnóstico rápido' : 'Sistema listo', pasoFinal === 'diagnostico' ? 'normal' : 'ok');
  if (guardar) localStorage.setItem(STORAGE_INICIO_STEP, pasoFinal);
  return true;
}

async function actualizarServidorLocal() {
  const titulo = $('inicioServidorTitulo');
  const detalle = $('inicioServidorDetalle');
  const resumen = $('inicioServidorEstado');
  try {
    const estadoApi = window.AutoVideoJeff?.servidor?.obtenerEstado;
    if (typeof estadoApi !== 'function') {
      if (titulo) titulo.textContent = 'Servidor local';
      if (detalle) detalle.textContent = 'No hay puente Electron disponible en esta vista. El servidor se validará al procesar.';
      if (resumen) resumen.textContent = 'Pendiente al procesar';
      setMensaje('Estado local pendiente. No se cambió ninguna configuración.', 'warn');
      return;
    }
    const estado = await estadoApi();
    const url = estado?.url || 'sin URL';
    if (titulo) titulo.textContent = estado?.activo === false ? 'Servidor no confirmado' : 'Servidor disponible';
    if (detalle) detalle.textContent = `URL local: ${url}`;
    if (resumen) resumen.textContent = estado?.activo === false ? 'No confirmado' : 'Disponible';
    setMensaje('Estado del servidor actualizado.', 'ok');
  } catch (error) {
    if (titulo) titulo.textContent = 'Servidor no confirmado';
    if (detalle) detalle.textContent = error.message || 'No se pudo consultar el servidor local.';
    if (resumen) resumen.textContent = 'No confirmado';
    setMensaje('No se pudo consultar el servidor local.', 'error');
  }
}

function enlazarEventos() {
  const root = document.querySelector('[data-inicio-root]');
  if (!root || root.dataset.inicioInicializado === '1') return;
  root.dataset.inicioInicializado = '1';

  root.addEventListener('click', async (evento) => {
    const accion = evento.target.closest('[data-inicio-action]')?.dataset.inicioAction;
    if (accion === 'refresh-server') {
      activarPasoInicio('servidor');
      await actualizarServidorLocal();
      return;
    }

    const paso = evento.target.closest('[data-inicio-wizard-go]')?.dataset.inicioWizardGo;
    if (paso) {
      setMensaje('', 'normal');
      activarPasoInicio(paso);
    }
  });

  activarPasoInicio(localStorage.getItem(STORAGE_INICIO_STEP) || 'estado', { guardar: false });
}

export function inicializarInicioUI() {
  if (typeof document === 'undefined') return false;
  if (!inicializado) {
    inicializado = true;
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'inicio') setTimeout(enlazarEventos, 0);
    });
  }
  enlazarEventos();
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarInicioUI);
}
