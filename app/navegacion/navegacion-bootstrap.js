import { inicializarNavegacionAutoVideoJeff } from './navegacion.service.js';
import { inicializarInicioUI } from '../inicio-ui.js';
import { inicializarNuevoProyectoUI } from '../nuevo-proyecto-ui.js';
import { inicializarDiagnosticoFuerteUI } from '../diagnostico-fuerte-ui.js';
import { inicializarDiagnosticoWizardUI } from '../diagnostico-wizard-ui.js';
import { inicializarEntendimientoUI } from '../etapas-ui/entendimiento-ui.js';
import { inicializarEntendimientoWizardUI } from '../etapas-ui/entendimiento-wizard-ui.js';
import * as controlFuncionalidades from '../control/control-funcionalidades.js';

function asegurarCss(id, href) {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function asegurarCssSiActivo(funcionalidad, id, href) {
  if (controlFuncionalidades.funcionalidadActiva(funcionalidad)) asegurarCss(id, href);
}

function asegurarEstilosBloques() {
  asegurarCss('desktopShellStyles', './desktop-shell.css');
  asegurarCss('inicioStyles', './inicio.css');
  asegurarCss('entendimientoStyles', './entendimiento.css');
  asegurarCss('diagnosticoStyles', './diagnostico.css');
  asegurarCssSiActivo('biblioteca', 'bibliotecaProyectoStyles', './biblioteca-proyecto.css');
  asegurarCssSiActivo('plan-edicion', 'planEdicionStyles', './plan-edicion.css');
  asegurarCssSiActivo('produccion', 'produccionMaestroStyles', './produccion-maestro.css');
  asegurarCssSiActivo('adaptacion', 'adaptacionStyles', './adaptacion.css');
  asegurarCssSiActivo('resultado', 'resultadoFinalStyles', './resultado-final.css');
  asegurarCssSiActivo('perfiles', 'perfilesStyles', './perfiles.css');
  asegurarCssSiActivo('ajustes', 'ajustesStyles', './ajustes.css');
}

async function iniciarModuloSiActivo(funcionalidad, rutaModulo, nombreExportado) {
  if (!controlFuncionalidades.funcionalidadActiva(funcionalidad)) return;
  const modulo = await import(rutaModulo);
  if (typeof modulo[nombreExportado] === 'function') modulo[nombreExportado]();
}

async function iniciarNavegacion() {
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

  await iniciarModuloSiActivo('diagnostico', '../auditoria-integral-ui.js', 'inicializarAuditoriaIntegralUI');
  await iniciarModuloSiActivo('resultado', '../resultado-final-ui.js', 'inicializarResultadoFinalUI');
  await iniciarModuloSiActivo('resultado', '../resultado-final-wizard-ui.js', 'inicializarResultadoFinalWizardUI');
  await iniciarModuloSiActivo('perfiles', '../perfiles-ui.js', 'inicializarPerfilesUI');
  await iniciarModuloSiActivo('ajustes', '../ajustes-gemini-ui.js', 'inicializarAjustesGeminiUI');
  await iniciarModuloSiActivo('ajustes', '../ajustes-wizard-ui.js', 'inicializarAjustesWizardUI');
  await iniciarModuloSiActivo('biblioteca', '../biblioteca-proyecto-ui.js', 'inicializarBibliotecaProyectoUI');
  await iniciarModuloSiActivo('biblioteca', '../biblioteca-imagenes-sugeridas-ui.js', 'inicializarBibliotecaImagenesSugeridasUI');
  await iniciarModuloSiActivo('plan-edicion', '../etapas-ui/plan-edicion-ui.js', 'inicializarPlanEdicionUI');
  await iniciarModuloSiActivo('plan-edicion', '../etapas-ui/plan-edicion-wizard-ui.js', 'inicializarPlanEdicionWizardUI');
  await iniciarModuloSiActivo('produccion', '../etapas-ui/produccion-maestro-ui.js', 'inicializarProduccionMaestroUI');
  await iniciarModuloSiActivo('produccion', '../etapas-ui/produccion-maestro-wizard-ui.js', 'inicializarProduccionMaestroWizardUI');
  await iniciarModuloSiActivo('adaptacion', '../etapas-ui/adaptacion-ui.js', 'inicializarAdaptacionUI');
  await iniciarModuloSiActivo('adaptacion', '../etapas-ui/adaptacion-wizard-ui.js', 'inicializarAdaptacionWizardUI');
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarNavegacion().catch((error) => console.error('No se pudo iniciar la navegación modular:', error));
});
