import { inicializarNavegacionAutoVideoJeff } from './navegacion.service.js';
import { inicializarDiagnosticoFuerteUI } from '../diagnostico-fuerte-ui.js';
import { inicializarAuditoriaIntegralUI } from '../auditoria-integral-ui.js';
import { inicializarResultadoFinalUI } from '../resultado-final-ui.js';
import { inicializarEntendimientoUI } from '../etapas-ui/entendimiento-ui.js';
import { inicializarPlanEdicionUI } from '../etapas-ui/plan-edicion-ui.js';
import { inicializarProduccionMaestroUI } from '../etapas-ui/produccion-maestro-ui.js';

function asegurarCss(id, href) {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function asegurarEstilosBloques() {
  asegurarCss('desktopShellStyles', './desktop-shell.css');
  asegurarCss('entendimientoStyles', './entendimiento.css');
  asegurarCss('planEdicionStyles', './plan-edicion.css');
  asegurarCss('produccionMaestroStyles', './produccion-maestro.css');
}

function iniciarNavegacion() {
  asegurarEstilosBloques();
  inicializarNavegacionAutoVideoJeff({
    contenedorMenu: document.getElementById('mainNavigation'),
    contenedorVista: document.getElementById('pantallaDinamica')
  });
  inicializarDiagnosticoFuerteUI();
  inicializarAuditoriaIntegralUI();
  inicializarResultadoFinalUI();
  inicializarEntendimientoUI();
  inicializarPlanEdicionUI();
  inicializarProduccionMaestroUI();
}

document.addEventListener('DOMContentLoaded', iniciarNavegacion);
