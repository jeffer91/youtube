import { inicializarNavegacionAutoVideoJeff } from './navegacion.service.js';
import { inicializarDiagnosticoFuerteUI } from '../diagnostico-fuerte-ui.js';
import { inicializarAuditoriaIntegralUI } from '../auditoria-integral-ui.js';

function iniciarNavegacion() {
  inicializarNavegacionAutoVideoJeff({
    contenedorMenu: document.getElementById('mainNavigation'),
    contenedorVista: document.getElementById('pantallaDinamica')
  });
  inicializarDiagnosticoFuerteUI();
  inicializarAuditoriaIntegralUI();
}

document.addEventListener('DOMContentLoaded', iniciarNavegacion);
