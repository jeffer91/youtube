import fs from 'fs';
import { PROCESOS_VISUALES_APP, VERSION_PROCESOS_UI, obtenerProcesoVisual, obtenerProcesosPorPantalla } from '../app/procesos-ui/procesos.config.js';
import { VERSION_PROCESO_VISUAL_SERVICE, construirEstadoPasos, renderizarResumenProceso } from '../app/procesos-ui/proceso-visual.service.js';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(ruta, claves) {
  const contenido = leer(ruta);
  for (const clave of claves) exigir(contenido.includes(clave), `${ruta} no contiene ${clave}`);
  return contenido;
}

function verificarCatalogoProcesos() {
  exigir(VERSION_PROCESOS_UI, 'Falta versión de procesos UI.');
  exigir(PROCESOS_VISUALES_APP.length >= 25, 'Deben existir al menos 25 procesos reales mapeados.');
  const ids = new Set();
  const requeridos = [
    'inicio', 'nuevo-proyecto', 'entendimiento', 'biblioteca-general', 'biblioteca-proyecto',
    'plan-edicion', 'laboratorio-efectos', 'produccion-maestro', 'adaptacion', 'resultado-final',
    'historial', 'perfiles', 'ajustes', 'diagnostico', 'servidor-api', 'proyectos', 'transcripcion',
    'gemini-ia', 'efectos-visuales', 'audio-sfx', 'exportacion', 'aprendizaje', 'reintento', 'auditoria', 'reportes-cierre'
  ];
  for (const proceso of PROCESOS_VISUALES_APP) {
    exigir(proceso.id, 'Hay proceso sin id.');
    exigir(!ids.has(proceso.id), `Proceso duplicado: ${proceso.id}`);
    ids.add(proceso.id);
    exigir(proceso.titulo, `Proceso ${proceso.id} sin título.`);
    exigir(Array.isArray(proceso.pasos) && proceso.pasos.length >= 3, `Proceso ${proceso.id} debe tener al menos 3 pasos.`);
    for (const paso of proceso.pasos) {
      exigir(paso.id && paso.titulo, `Paso incompleto en ${proceso.id}.`);
      exigir(paso.conservaFuncionalidad === true, `Paso ${proceso.id}/${paso.id} debe marcar conservaFuncionalidad.`);
    }
  }
  for (const id of requeridos) exigir(obtenerProcesoVisual(id)?.id === id, `Falta proceso requerido: ${id}`);
  exigir(obtenerProcesosPorPantalla('biblioteca').length >= 2, 'Biblioteca debe tener proceso general y proceso de proyecto.');
}

function verificarServicioProcesos() {
  exigir(VERSION_PROCESO_VISUAL_SERVICE, 'Falta versión del servicio de procesos UI.');
  const estados = construirEstadoPasos('plan-edicion', 'timeline');
  exigir(estados.some((paso) => paso.id === 'timeline' && paso.estado === 'activo'), 'No marca paso activo correctamente.');
  exigir(estados.some((paso) => paso.estado === 'completado'), 'No marca pasos completados.');
  exigir(estados.some((paso) => paso.estado === 'bloqueado'), 'No marca pasos bloqueados.');
  const html = renderizarResumenProceso(obtenerProcesoVisual('laboratorio-efectos'), 'probar');
  exigir(html.includes('process-visual-summary'), 'No renderiza resumen visual.');
  exigir(html.includes('Laboratorio de efectos'), 'Resumen visual no conserva título.');
}

function verificarIntegracionArchivos() {
  contiene('app/index.html', [
    './procesos-ui/proceso-visual.css',
    'pantallaDinamica',
    'navegacion-bootstrap.js'
  ]);
  contiene('app/navegacion/navegacion.service.js', [
    '../procesos-ui/proceso-visual.service.js',
    'aplicarProcesoVisual',
    'conectarProcesosConNavegacion',
    'aplicarProcesoVisual({ pantallaId: item.id, contenedor })',
    'conectarProcesosConNavegacion(contenedorVista)'
  ]);
  contiene('app/procesos-ui/proceso-visual.css', [
    '.process-visual-summary',
    '.process-visual-steps',
    '[data-proceso-step]',
    '[data-proceso-avanzado]',
    '[data-proceso-resumen]'
  ]);
}

function verificarPackage() {
  const pkg = JSON.parse(leer('package.json'));
  exigir(pkg.scripts?.['check:procesos-ui'] === 'node scripts/verificar-procesos-ui.js', 'Falta script check:procesos-ui.');
  exigir((pkg.build?.files || []).includes('app/**/*'), 'Build debe incluir app/**/*.');
  exigir((pkg.build?.files || []).includes('scripts/**/*'), 'Build debe incluir scripts/**/*.');
}

function main() {
  verificarCatalogoProcesos();
  verificarServicioProcesos();
  verificarIntegracionArchivos();
  verificarPackage();
  console.log(`OK Procesos UI: ${PROCESOS_VISUALES_APP.length} procesos mapeados, servicio visual, CSS, navegación y package listos.`);
}

main();
