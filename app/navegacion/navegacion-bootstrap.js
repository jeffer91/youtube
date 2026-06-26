import { inicializarNavegacionAutoVideoJeff } from './navegacion.service.js';

function iniciarNavegacion() {
  inicializarNavegacionAutoVideoJeff({
    contenedorMenu: document.getElementById('mainNavigation'),
    contenedorVista: document.getElementById('pantallaDinamica')
  });
}

document.addEventListener('DOMContentLoaded', iniciarNavegacion);
