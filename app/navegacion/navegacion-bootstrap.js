import { inicializarNavegacionAutoVideoJeff } from './navegacion.service.js';
import { inicializarInicioUI } from '../inicio-ui.js';
import { inicializarNuevoProyectoUI } from '../nuevo-proyecto-ui.js';
import { inicializarDiagnosticoFuerteUI } from '../diagnostico-fuerte-ui.js';
import { inicializarDiagnosticoWizardUI } from '../diagnostico-wizard-ui.js';
import { inicializarAuditoriaIntegralUI } from '../auditoria-integral-ui.js';
import { inicializarResultadoFinalUI } from '../resultado-final-ui.js';
import { inicializarResultadoFinalWizardUI } from '../resultado-final-wizard-ui.js';
import { inicializarPerfilesUI } from '../perfiles-ui.js';
import { inicializarAjustesGeminiUI } from '../ajustes-gemini-ui.js';
import { inicializarAjustesWizardUI } from '../ajustes-wizard-ui.js';
import { inicializarEntendimientoUI } from '../etapas-ui/entendimiento-ui.js';
import { inicializarEntendimientoWizardUI } from '../etapas-ui/entendimiento-wizard-ui.js';
import { inicializarBibliotecaProyectoUI } from '../biblioteca-proyecto-ui.js';
import { inicializarBibliotecaImagenesSugeridasUI } from '../biblioteca-imagenes-sugeridas-ui.js';
import { inicializarPlanEdicionUI } from '../etapas-ui/plan-edicion-ui.js';
import { inicializarPlanEdicionWizardUI } from '../etapas-ui/plan-edicion-wizard-ui.js';
import { inicializarProduccionMaestroUI } from '../etapas-ui/produccion-maestro-ui.js';
import { inicializarProduccionMaestroWizardUI } from '../etapas-ui/produccion-maestro-wizard-ui.js';
import { inicializarAdaptacionUI } from '../etapas-ui/adaptacion-ui.js';
import { inicializarAdaptacionWizardUI } from '../etapas-ui/adaptacion-wizard-ui.js';

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
  asegurarCss('bibliotecaProyectoStyles', './biblioteca-proyecto.css');
  asegurarCss('planEdicionStyles', './plan-edicion.css');
  asegurarCss('produccionMaestroStyles', './produccion-maestro.css');
  asegurarCss('adaptacionStyles', './adaptacion.css');
  asegurarCss('resultadoFinalStyles', './resultado-final.css');
  asegurarCss('perfilesStyles', './perfiles.css');
  asegurarCss('ajustesStyles', './ajustes.css');
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
  inicializarAuditoriaIntegralUI();
  inicializarResultadoFinalUI();
  inicializarResultadoFinalWizardUI();
  inicializarPerfilesUI();
  inicializarAjustesGeminiUI();
  inicializarAjustesWizardUI();
  inicializarEntendimientoUI();
  inicializarEntendimientoWizardUI();
  inicializarBibliotecaProyectoUI();
  inicializarBibliotecaImagenesSugeridasUI();
  inicializarPlanEdicionUI();
  inicializarPlanEdicionWizardUI();
  inicializarProduccionMaestroUI();
  inicializarProduccionMaestroWizardUI();
  inicializarAdaptacionUI();
  inicializarAdaptacionWizardUI();
}

document.addEventListener('DOMContentLoaded', iniciarNavegacion);
