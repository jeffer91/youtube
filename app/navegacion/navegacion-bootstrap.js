import { inicializarNavegacionAutoVideoJeff } from './navegacion.service.js';
import { inicializarInicioUI } from '../inicio-ui.js';
import { inicializarNuevoProyectoUI } from '../nuevo-proyecto-ui.js';
import { inicializarDiagnosticoFuerteUI } from '../diagnostico-fuerte-ui.js';
import { inicializarDiagnosticoWizardUI } from '../diagnostico-wizard-ui.js';
import { inicializarEntendimientoUI } from '../etapas-ui/entendimiento-ui.js';
import { inicializarEntendimientoWizardUI } from '../etapas-ui/entendimiento-wizard-ui.js';

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
  asegurarCss('inicioStyles', './inicio.css');
  asegurarCss('entendimientoStyles', './entendimiento.css');
  asegurarCss('diagnosticoStyles', './diagnostico.css');
}

function iniciarNavegacion() {
  asegurarEstilosBloques();
  inicializarNavegacionAutoVideoJeff({
    contenedorMenu: document.getElementById('mainNavigation'),
    contenedorVista: document.getElementById('pantallaDinamica')
  });
  inicializarInicioUI();
  inicializarNuevoProyectoUI();
  inicializarDiagnosticoFuerteUI();
  inicializarDiagnosticoWizardUI();
  inicializarEntendimientoUI();
  inicializarEntendimientoWizardUI();
}

document.addEventListener('DOMContentLoaded', iniciarNavegacion);
