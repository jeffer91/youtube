import { inicializarNavegacionAutoVideoJeff } from './navegacion.service.js';
import { inicializarDiagnosticoFuerteUI } from '../diagnostico-fuerte-ui.js';
import { inicializarAuditoriaIntegralUI } from '../auditoria-integral-ui.js';
import { inicializarResultadoFinalUI } from '../resultado-final-ui.js';
import { inicializarEntendimientoUI } from '../etapas-ui/entendimiento-ui.js';
import { inicializarEntendimientoWizardUI } from '../etapas-ui/entendimiento-wizard-ui.js';
import { inicializarBibliotecaProyectoUI } from '../biblioteca-proyecto-ui.js';
import { inicializarPlanEdicionUI } from '../etapas-ui/plan-edicion-ui.js';
import { inicializarProduccionMaestroUI } from '../etapas-ui/produccion-maestro-ui.js';
import { inicializarAdaptacionUI } from '../etapas-ui/adaptacion-ui.js';

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
  asegurarCss('bibliotecaProyectoStyles', './biblioteca-proyecto.css');
  asegurarCss('planEdicionStyles', './plan-edicion.css');
  asegurarCss('produccionMaestroStyles', './produccion-maestro.css');
  asegurarCss('adaptacionStyles', './adaptacion.css');
  asegurarCss('resultadoFinalStyles', './resultado-final.css');
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
  inicializarEntendimientoWizardUI();
  inicializarBibliotecaProyectoUI();
  inicializarPlanEdicionUI();
  inicializarProduccionMaestroUI();
  inicializarAdaptacionUI();
}

document.addEventListener('DOMContentLoaded', iniciarNavegacion);
