import { aplicarProcesoVisual } from './procesos-ui/proceso-visual.service.js';
import { ejecutarDiagnosticoFuerteUI, ejecutarDiagnosticoFinalRedisenioUI } from './diagnostico-fuerte-ui.js';
import { ejecutarAuditoriaIntegralUI } from './auditoria-integral-ui.js';

const STORAGE_DIAGNOSTICO_STEP = 'autovideojeff.diagnosticoPaso';
const PASOS_DIAGNOSTICO = ['rapido', 'fuerte', 'auditoria', 'final', 'detalle'];
const MAPA_PASO_PROCESO = Object.freeze({
  rapido: 'rapido',
  fuerte: 'fuerte',
  auditoria: 'auditoria',
  final: 'final',
  detalle: 'detalle-tecnico'
});

let inicializado = false;

function $(id) { return document.getElementById(id); }

function tieneResultado(id) {
  const nodo = $(id);
  if (!nodo) return false;
  return nodo.textContent.trim().length > 0;
}

function estadoPaso(paso, activo) {
  if (paso === 'rapido') return activo === paso ? 'active' : 'done';
  if (paso === 'fuerte') return activo === paso ? 'active' : tieneResultado('strongDiagnosticResult') ? 'done' : 'active';
  if (paso === 'auditoria') return activo === paso ? 'active' : tieneResultado('integralAuditResult') ? 'done' : 'active';
  if (paso === 'final') return activo === paso ? 'active' : tieneResultado('finalRedesignDiagnosticResult') ? 'done' : 'active';
  if (paso === 'detalle') return activo === paso ? 'active' : 'advanced';
  return 'locked';
}

function setChip(texto = 'Listo para revisar', tipo = 'normal') {
  const chip = $('diagnosticoStateChip');
  if (!chip) return;
  chip.textContent = texto;
  chip.className = `aj-status-chip diagnostic-chip is-${tipo}`;
}

function setMensaje(texto = '', tipo = 'normal') {
  const box = $('diagnosticoMessage');
  if (!box) return;
  box.hidden = !texto;
  box.textContent = texto;
  box.className = `diagnostic-message is-${tipo}`;
}

export function activarPasoDiagnostico(paso = 'rapido', { guardar = true } = {}) {
  const root = document.querySelector('[data-diagnostico-root]');
  if (!root) return false;
  const pasoFinal = PASOS_DIAGNOSTICO.includes(paso) ? paso : 'rapido';
  root.dataset.procesoPasoActivo = MAPA_PASO_PROCESO[pasoFinal] || 'rapido';

  root.querySelectorAll('[data-diagnostico-wizard-panel]').forEach((panel) => {
    const activo = panel.dataset.diagnosticoWizardPanel === pasoFinal;
    panel.classList.toggle('is-active', activo);
    panel.hidden = !activo;
  });

  root.querySelectorAll('[data-diagnostico-wizard-go]').forEach((boton) => {
    const id = boton.dataset.diagnosticoWizardGo;
    const estado = estadoPaso(id, pasoFinal);
    boton.classList.toggle('is-active', estado === 'active');
    boton.classList.toggle('is-done', estado === 'done');
    boton.classList.toggle('is-locked', estado === 'locked');
    boton.classList.toggle('is-advanced', estado === 'advanced');
  });

  aplicarProcesoVisual({ contenedor: root, procesoId: 'diagnostico', pasoActivoId: root.dataset.procesoPasoActivo });
  setChip(pasoFinal === 'detalle' ? 'Detalle técnico' : `Paso: ${pasoFinal}`, pasoFinal === 'rapido' ? 'normal' : 'ok');
  if (guardar) localStorage.setItem(STORAGE_DIAGNOSTICO_STEP, pasoFinal);
  return true;
}

async function irAPasoDiagnostico(paso = 'rapido') {
  setMensaje('', 'normal');
  activarPasoDiagnostico(paso);
}

async function ejecutarAccionDiagnostico(accion) {
  if (accion === 'strong') {
    activarPasoDiagnostico('fuerte');
    setMensaje('Ejecutando diagnóstico fuerte...', 'normal');
    const ok = await ejecutarDiagnosticoFuerteUI();
    setMensaje(ok ? 'Diagnóstico fuerte finalizado.' : 'El diagnóstico fuerte tuvo errores.', ok ? 'ok' : 'error');
    activarPasoDiagnostico('fuerte', { guardar: false });
    return;
  }
  if (accion === 'audit') {
    activarPasoDiagnostico('auditoria');
    setMensaje('Ejecutando auditoría integral...', 'normal');
    const ok = await ejecutarAuditoriaIntegralUI();
    setMensaje(ok ? 'Auditoría integral finalizada.' : 'La auditoría integral tuvo errores.', ok ? 'ok' : 'error');
    activarPasoDiagnostico('auditoria', { guardar: false });
    return;
  }
  if (accion === 'final-redisenio') {
    activarPasoDiagnostico('final');
    setMensaje('Ejecutando diagnóstico final del rediseño...', 'normal');
    const ok = await ejecutarDiagnosticoFinalRedisenioUI();
    setMensaje(ok ? 'Diagnóstico final del rediseño finalizado.' : 'El diagnóstico final tuvo errores.', ok ? 'ok' : 'error');
    activarPasoDiagnostico('final', { guardar: false });
  }
}

function enlazarEventos() {
  const root = document.querySelector('[data-diagnostico-root]');
  if (!root || root.dataset.diagnosticoWizardInicializado === '1') return;
  root.dataset.diagnosticoWizardInicializado = '1';

  root.addEventListener('click', async (evento) => {
    const accion = evento.target.closest('[data-diagnostic-action]')?.dataset.diagnosticAction;
    if (accion) {
      await ejecutarAccionDiagnostico(accion);
      return;
    }
    const paso = evento.target.closest('[data-diagnostico-wizard-go]')?.dataset.diagnosticoWizardGo;
    if (paso) {
      await irAPasoDiagnostico(paso);
      return;
    }
  });

  ['strongDiagnosticResult', 'integralAuditResult', 'finalRedesignDiagnosticResult'].forEach((id) => {
    const nodo = $(id);
    if (!nodo) return;
    const observer = new MutationObserver(() => activarPasoDiagnostico(localStorage.getItem(STORAGE_DIAGNOSTICO_STEP) || 'rapido', { guardar: false }));
    observer.observe(nodo, { childList: true, subtree: true, characterData: true });
  });

  activarPasoDiagnostico(localStorage.getItem(STORAGE_DIAGNOSTICO_STEP) || 'rapido', { guardar: false });
}

export function inicializarDiagnosticoWizardUI() {
  if (typeof document === 'undefined') return false;
  if (!inicializado) {
    inicializado = true;
    document.addEventListener('autovideo:navegacion', (evento) => {
      if (evento.detail?.pantallaId === 'diagnostico') setTimeout(enlazarEventos, 0);
    });
  }
  enlazarEventos();
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarDiagnosticoWizardUI);
}
