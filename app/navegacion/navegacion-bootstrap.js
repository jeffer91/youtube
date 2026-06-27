import { inicializarNavegacionAutoVideoJeff } from './navegacion.service.js';
import { inicializarDiagnosticoFuerteUI } from '../diagnostico-fuerte-ui.js';
import { inicializarAuditoriaIntegralUI } from '../auditoria-integral-ui.js';
import { inicializarResultadoFinalUI } from '../resultado-final-ui.js';

function asegurarShellEscritorioCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('desktopShellStyles')) return;
  const link = document.createElement('link');
  link.id = 'desktopShellStyles';
  link.rel = 'stylesheet';
  link.href = './desktop-shell.css';
  document.head.appendChild(link);
}

function iniciarNavegacion() {
  asegurarShellEscritorioCss();
  inicializarNavegacionAutoVideoJeff({
    contenedorMenu: document.getElementById('mainNavigation'),
    contenedorVista: document.getElementById('pantallaDinamica')
  });
  inicializarDiagnosticoFuerteUI();
  inicializarAuditoriaIntegralUI();
  inicializarResultadoFinalUI();
}

document.addEventListener('DOMContentLoaded', iniciarNavegacion);
