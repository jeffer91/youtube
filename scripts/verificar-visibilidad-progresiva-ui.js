/* Verificación global: visibilidad progresiva en pantallas principales. */

import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(contenido, claves, contexto) {
  for (const clave of claves) exigir(contenido.includes(clave), `${contexto} no contiene ${clave}`);
}

function verificarArchivo({ ruta, claves, contexto }) {
  const contenido = leer(ruta);
  contiene(contenido, claves, contexto || ruta);
  return contenido;
}

function verificarPantallas() {
  verificarArchivo({
    ruta: 'app/index.html',
    contexto: 'Nuevo proyecto guiado en index',
    claves: [
      'data-nuevo-proyecto-root',
      'data-proceso-root="nuevo-proyecto"',
      'data-proceso-resumen="nuevo-proyecto"',
      'data-nuevo-wizard-go="nombre"',
      'data-nuevo-wizard-go="subir-video"',
      'data-nuevo-wizard-go="procesar"',
      'data-nuevo-wizard-go="tecnico"',
      'projectNameInput',
      'videoInput',
      'processButton',
      'legacy-options-hidden'
    ]
  });

  const pantallas = [
    ['app/pantallas/inicio.view.js', 'Inicio', ['data-inicio-root', 'data-proceso-root="inicio"', 'data-proceso-resumen="inicio"', 'data-inicio-wizard-panel="estado"', 'data-inicio-wizard-panel="accesos"', 'data-inicio-wizard-panel="servidor"', 'data-inicio-wizard-panel="diagnostico"']],
    ['app/pantallas/entendimiento.view.js', 'Entendimiento', ['data-entendimiento-root', 'data-proceso-root="entendimiento"', 'data-proceso-resumen="entendimiento"', 'data-entendimiento-wizard-panel="cargar"', 'data-entendimiento-wizard-panel="analisis"']],
    ['app/pantallas/biblioteca.view.js', 'Biblioteca general', ['data-proceso-root="biblioteca-general"', 'data-proceso-resumen="biblioteca-general"', 'data-library-wizard-panel="archivo"', 'data-library-wizard-panel="categoria"', 'data-library-wizard-panel="datos"', 'data-library-wizard-panel="guardar"']],
    ['app/pantallas/biblioteca-proyecto.view.js', 'Biblioteca proyecto', ['data-project-library-root', 'data-proceso-root="biblioteca-proyecto"', 'data-proceso-resumen="biblioteca-proyecto"', 'data-project-library-wizard-panel="proyecto"', 'data-project-library-wizard-panel="plan"']],
    ['app/pantallas/plan-edicion.view.js', 'Plan edición', ['data-plan-root', 'data-proceso-root="plan-edicion"', 'data-proceso-resumen="plan-edicion"', 'data-plan-wizard-panel="cargar"', 'data-plan-wizard-panel="aprobar"', 'data-plan-wizard-panel="producir"']],
    ['app/pantallas/laboratorio-efectos.view.js', 'Laboratorio efectos', ['data-lab-efectos-root', 'data-proceso-root="laboratorio-efectos"', 'data-proceso-resumen="laboratorio-efectos"', 'data-lab-wizard-panel="video"', 'data-lab-wizard-panel="comparar"']],
    ['app/pantallas/produccion.view.js', 'Producción maestro', ['data-produccion-maestro-root', 'data-proceso-root="produccion-maestro"', 'data-proceso-resumen="produccion-maestro"', 'data-produccion-wizard-panel="cargar"', 'data-produccion-wizard-panel="adaptacion"']],
    ['app/pantallas/adaptacion.view.js', 'Adaptación', ['data-adaptacion-root', 'data-proceso-root="adaptacion"', 'data-proceso-resumen="adaptacion"', 'data-adaptacion-wizard-panel="cargar"', 'data-adaptacion-wizard-panel="resultado"']],
    ['app/pantallas/resultado.view.js', 'Resultado final', ['data-resultado-final-root', 'data-proceso-root="resultado-final"', 'data-proceso-resumen="resultado-final"', 'data-resultado-wizard-panel="cargar"', 'data-resultado-wizard-panel="reporte"']],
    ['app/pantallas/historial.view.js', 'Historial', ['data-history-root', 'data-proceso-root="historial"', 'data-proceso-resumen="historial"', 'data-history-wizard-panel="cargar"', 'data-history-wizard-panel="metadata"']],
    ['app/pantallas/perfiles.view.js', 'Perfiles', ['data-perfiles-root', 'data-proceso-root="perfiles"', 'data-proceso-resumen="perfiles"', 'data-perfiles-wizard-panel="elegir"', 'data-perfiles-wizard-panel="uso"']],
    ['app/pantallas/ajustes.view.js', 'Ajustes', ['data-ajustes-root', 'data-proceso-root="ajustes"', 'data-proceso-resumen="ajustes"', 'data-ajustes-wizard-panel="activar"', 'data-ajustes-wizard-panel="guardar"']],
    ['app/pantallas/diagnostico.view.js', 'Diagnóstico', ['data-diagnostico-root', 'data-proceso-root="diagnostico"', 'data-proceso-resumen="diagnostico"', 'data-diagnostico-wizard-panel="rapido"', 'data-diagnostico-wizard-panel="detalle"']]
  ];

  for (const [ruta, contexto, claves] of pantallas) verificarArchivo({ ruta, contexto, claves });
}

function verificarControladores() {
  const controladores = [
    ['app/inicio-ui.js', ['activarPasoInicio', 'PASOS_INICIO', 'MAPA_PASO_PROCESO', 'autovideojeff.inicioPaso']],
    ['app/nuevo-proyecto-ui.js', ['activarPasoNuevoProyecto', 'PASOS_NUEVO_PROYECTO', 'MAPA_PASO_PROCESO', 'autovideojeff.nuevoProyectoPaso']],
    ['app/biblioteca-ui.js', ['activarPasoBibliotecaGeneral', 'PASOS_BIBLIOTECA_GENERAL', 'MAPA_PASO_PROCESO', 'autovideojeff.bibliotecaGeneralPaso']],
    ['app/biblioteca-proyecto-ui.js', ['activarPasoBibliotecaProyecto', 'PASOS_BIBLIOTECA_PROYECTO', 'MAPA_PASO_PROCESO', 'autovideojeff.bibliotecaProyectoPaso']],
    ['app/etapas-ui/entendimiento-wizard-ui.js', ['activarPasoEntendimiento', 'PASOS_ENTENDIMIENTO', 'MAPA_PASO_PROCESO', 'autovideojeff.entendimientoPaso']],
    ['app/etapas-ui/plan-edicion-wizard-ui.js', ['activarPasoPlanEdicion', 'PASOS_PLAN', 'MAPA_PASO_PROCESO', 'autovideojeff.planEdicionPaso']],
    ['app/laboratorio-efectos-ui.js', ['activarPasoLaboratorioEfectos', 'PASOS_LAB', 'MAPA_PASO_PROCESO', 'autovideojeff.laboratorioEfectosPaso']],
    ['app/etapas-ui/produccion-maestro-wizard-ui.js', ['activarPasoProduccionMaestro', 'PASOS_PRODUCCION', 'MAPA_PASO_PROCESO', 'autovideojeff.produccionMaestroPaso']],
    ['app/etapas-ui/adaptacion-wizard-ui.js', ['activarPasoAdaptacion', 'PASOS_ADAPTACION', 'MAPA_PASO_PROCESO', 'autovideojeff.adaptacionPaso']],
    ['app/resultado-final-wizard-ui.js', ['activarPasoResultadoFinal', 'PASOS_RESULTADO', 'MAPA_PASO_PROCESO', 'autovideojeff.resultadoFinalPaso']],
    ['app/historial-proyectos-ui.js', ['activarPasoHistorial', 'PASOS_HISTORIAL', 'MAPA_PASO_PROCESO', 'autovideojeff.proyectoEtapasId']],
    ['app/perfiles-ui.js', ['activarPasoPerfiles', 'PASOS_PERFILES', 'MAPA_PASO_PROCESO', 'autovideojeff.perfilActivo']],
    ['app/ajustes-wizard-ui.js', ['activarPasoAjustes', 'PASOS_AJUSTES', 'MAPA_PASO_PROCESO', 'autovideojeff.ajustesPaso']],
    ['app/diagnostico-wizard-ui.js', ['activarPasoDiagnostico', 'PASOS_DIAGNOSTICO', 'MAPA_PASO_PROCESO', 'autovideojeff.diagnosticoPaso']]
  ];

  for (const [ruta, claves] of controladores) verificarArchivo({ ruta, contexto: `Controlador ${ruta}`, claves: ['./procesos-ui/proceso-visual.service.js'].filter((x) => !ruta.includes('etapas-ui')).concat(claves) });
}

function verificarEstilos() {
  const estilos = [
    ['app/procesos-ui/proceso-visual.css', ['process-visual-summary', 'process-visual-steps', 'data-proceso-avanzado']],
    ['app/inicio.css', ['inicio-flow', 'inicio-wizard-panel']],
    ['app/nuevo-proyecto-limpio.css', ['clean-project-flow', 'clean-project-step']],
    ['app/biblioteca-ui.css', ['library-guided-layout', 'library-wizard-panel']],
    ['app/biblioteca-proyecto.css', ['project-library-flow', 'project-library-wizard-panel']],
    ['app/entendimiento.css', ['entendimiento-flow', 'entendimiento-wizard-panel']],
    ['app/plan-edicion.css', ['plan-flow', 'plan-wizard-panel']],
    ['app/laboratorio-efectos-guiado.css', ['lab-effects-flow', 'lab-effects-wizard-panel']],
    ['app/produccion-maestro.css', ['produccion-maestro-flow', 'produccion-maestro-wizard-panel']],
    ['app/adaptacion.css', ['adaptacion-flow', 'adaptacion-wizard-panel']],
    ['app/resultado-final.css', ['result-final-flow', 'result-final-wizard-panel']],
    ['app/historial-proyectos.css', ['history-flow', 'history-wizard-panel']],
    ['app/perfiles.css', ['profiles-flow', 'profiles-wizard-panel']],
    ['app/ajustes.css', ['ajustes-flow', 'ajustes-wizard-panel']],
    ['app/diagnostico.css', ['diagnostic-flow', 'diagnostic-wizard-panel']]
  ];

  for (const [ruta, claves] of estilos) verificarArchivo({ ruta, contexto: `CSS ${ruta}`, claves });
}

function verificarNavegacionYProcesos() {
  verificarArchivo({
    ruta: 'app/navegacion/navegacion.service.js',
    contexto: 'Navegación general',
    claves: ['aplicarProcesoVisual', 'conectarProcesosConNavegacion', 'autovideo:navegacion', 'inicializarLaboratorioEfectosUI']
  });

  verificarArchivo({
    ruta: 'app/navegacion/navegacion-bootstrap.js',
    contexto: 'Bootstrap navegación',
    claves: [
      'inicializarInicioUI',
      'inicializarNuevoProyectoUI',
      'inicializarEntendimientoWizardUI',
      'inicializarPlanEdicionWizardUI',
      'inicializarProduccionMaestroWizardUI',
      'inicializarAdaptacionWizardUI',
      'inicializarResultadoFinalWizardUI',
      'inicializarPerfilesUI',
      'inicializarAjustesWizardUI',
      'inicializarDiagnosticoWizardUI'
    ]
  });

  verificarArchivo({
    ruta: 'app/procesos-ui/procesos.config.js',
    contexto: 'Configuración procesos UI',
    claves: [
      'inicio', 'nuevo-proyecto', 'entendimiento', 'biblioteca-general', 'biblioteca-proyecto',
      'plan-edicion', 'laboratorio-efectos', 'produccion-maestro', 'adaptacion', 'resultado-final',
      'historial', 'perfiles', 'ajustes', 'diagnostico'
    ]
  });
}

function main() {
  verificarPantallas();
  verificarControladores();
  verificarEstilos();
  verificarNavegacionYProcesos();
  console.log('OK visibilidad progresiva UI: pantallas, controladores, CSS, navegación y procesos conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR visibilidad progresiva UI:', error.message);
  process.exit(1);
}
