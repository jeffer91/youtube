import { inicializarNavegacionAutoVideoJeff } from './navegacion.service.js';
import { inicializarDiagnosticoFuerteUI } from '../diagnostico-fuerte-ui.js';

function iniciarNavegacion() {
  inicializarNavegacionAutoVideoJeff({
    contenedorMenu: document.getElementById('mainNavigation'),
    contenedorVista: document.getElementById('pantallaDinamica')
  });
  inicializarDiagnosticoFuerteUI();
}

document.addEventListener('DOMContentLoaded', iniciarNavegacion);
