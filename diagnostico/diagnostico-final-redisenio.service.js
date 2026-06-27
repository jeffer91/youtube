/*
  Bloque 18: Diagnóstico final y verificadores
  Función: auditar el rediseño completo por etapas antes de cerrar AutoVideoJeff.
*/

import fs from 'fs';
import path from 'path';
import { escribirJson, obtenerRutaDatos, obtenerRutaRaiz } from '../comun/archivos.js';

const ARCHIVOS_FLUJO_FINAL = Object.freeze([
  'server.js',
  'server/rutas-etapas.service.js',
  'server/rutas-modulares.service.js',
  'flujo-etapas/estado-proyecto.modelo.js',
  'flujo-etapas/estado-proyecto.service.js',
  'entender/etapas/entendimiento-etapa.service.js',
  'etapas/02-plan/procesar-plan-edicion.service.js',
  'etapas/03-produccion/procesar-produccion-maestro.service.js',
  'etapas/04-adaptacion/procesar-adaptacion-plataformas.service.js',
  'etapas/05-resultado/procesar-resultado-final.service.js',
  'biblioteca/seleccionar-recursos-produccion.service.js',
  'editar/efectos/premium/efectos-premium.service.js',
  'editar/edicion-dinamica/sonidos/premium/sfx-premium.service.js'
]);

const ARCHIVOS_UI_FINAL = Object.freeze([
  'app/pantallas/nuevo-proyecto.view.js',
  'app/pantallas/entendimiento.view.js',
  'app/pantallas/plan-edicion.view.js',
  'app/pantallas/produccion.view.js',
  'app/pantallas/adaptacion.view.js',
  'app/pantallas/resultado.view.js',
  'app/etapas-ui/entendimiento-ui.js',
  'app/etapas-ui/plan-edicion-ui.js',
  'app/etapas-ui/produccion-maestro-ui.js',
  'app/etapas-ui/adaptacion-ui.js',
  'app/resultado-final-ui.js',
  'app/navegacion/menu.config.js',
  'app/navegacion/navegacion.service.js',
  'app/navegacion/navegacion-bootstrap.js',
  'app/desktop-shell.css',
  'app/entendimiento.css',
  'app/plan-edicion.css',
  'app/produccion-maestro.css',
  'app/adaptacion.css',
  'app/resultado-final.css'
]);

const RUTAS_API_ETAPAS = Object.freeze([
  '/api/proyectos',
  '/api/proyectos/:proyectoId/videos',
  '/api/proyectos/:proyectoId/entendimiento/procesar',
  '/api/proyectos/:proyectoId/plan/procesar',
  '/api/proyectos/:proyectoId/produccion/procesar',
  '/api/proyectos/:proyectoId/adaptacion/procesar',
  '/api/proyectos/:proyectoId/resultado/exportar',
  '/api/autovideo/diagnostico/final-redisenio'
]);

const IDS_UI_ETAPAS = Object.freeze([
  'projectNameInput',
  'entendimientoProyectoId',
  'planProyectoId',
  'produccionMaestroProyectoId',
  'adaptacionProyectoId',
  'resultadoFinalProyectoId',
  'resultadoFinalGenerarBtn',
  'adaptacionProcesarBtn',
  'produccionMaestroProcesarBtn',
  'planProcesarBtn',
  'entendimientoProcesarBtn'
]);

const SCRIPTS_BLOQUES = Object.freeze([
  'scripts/verificar-bloque-01-redisenio-etapas.js',
  'scripts/verificar-bloque-02-shell-escritorio.js',
  'scripts/verificar-bloque-03-estado-etapas.js',
  'scripts/verificar-bloque-04-nuevo-proyecto-limpio.js',
  'scripts/verificar-bloque-05-api-etapas.js',
  'scripts/verificar-bloque-06-entendimiento-backend.js',
  'scripts/verificar-bloque-07-pantalla-entendimiento.js',
  'scripts/verificar-bloque-08-plan-backend.js',
  'scripts/verificar-bloque-09-pantalla-plan.js',
  'scripts/verificar-bloque-10-produccion-backend.js',
  'scripts/verificar-bloque-11-pantalla-produccion.js',
  'scripts/verificar-bloque-12-biblioteca-produccion.js',
  'scripts/verificar-bloque-13-efectos-premium.js',
  'scripts/verificar-bloque-14-sfx-premium.js',
  'scripts/verificar-bloque-15-adaptacion-backend.js',
  'scripts/verificar-bloque-16-pantalla-adaptacion.js',
  'scripts/verificar-bloque-17-resultado-final.js',
  'scripts/verificar-bloque-18-autovideo.js'
]);

const DOCS_BLOQUES = Object.freeze([
  'docs/bloque-05-api-por-etapas.md',
  'docs/bloque-06-entendimiento-backend.md',
  'docs/bloque-07-pantalla-entendimiento.md',
  'docs/bloque-08-plan-backend.md',
  'docs/bloque-09-pantalla-plan.md',
  'docs/bloque-10-produccion-backend.md',
  'docs/bloque-11-pantalla-produccion-maestro.md',
  'docs/bloque-12-biblioteca-produccion.md',
  'docs/bloque-13-efectos-visuales-premium.md',
  'docs/bloque-14-sfx-premium.md',
  'docs/bloque-15-adaptacion-plataformas-backend.md',
  'docs/bloque-16-pantalla-adaptacion.md',
  'docs/bloque-17-resultado-final.md',
  'docs/bloque-18-diagnostico-final.md'
]);

function rutaAbs(relativo) {
  return path.join(obtenerRutaRaiz(), relativo);
}

function existe(relativo) {
  return fs.existsSync(rutaAbs(relativo));
}

function leer(relativo) {
  return fs.readFileSync(rutaAbs(relativo), 'utf-8');
}

function crearRevisionArchivos(nombre, archivos) {
  const faltantes = archivos.filter((archivo) => !existe(archivo));
  return {
    nombre,
    ok: faltantes.length === 0,
    total: archivos.length,
    faltantes,
    revisados: archivos.filter((archivo) => !faltantes.includes(archivo))
  };
}

function buscarEnArchivos(archivos, termino) {
  return archivos.some((archivo) => existe(archivo) && leer(archivo).includes(termino));
}

function verificarRutasApi() {
  const fuentes = ['server/rutas-etapas.service.js', 'server/rutas-modulares.service.js'].filter(existe).map(leer).join('\n');
  const faltantes = RUTAS_API_ETAPAS.filter((ruta) => !fuentes.includes(ruta));
  return {
    nombre: 'rutas-api-etapas',
    ok: faltantes.length === 0,
    total: RUTAS_API_ETAPAS.length,
    faltantes
  };
}

function verificarUiEtapas() {
  const faltantes = IDS_UI_ETAPAS.filter((id) => !buscarEnArchivos(ARCHIVOS_UI_FINAL, id));
  const flujoMenuOk = existe('app/navegacion/menu.config.js') && ['nuevo-proyecto', 'entendimiento', 'plan-edicion', 'produccion', 'adaptacion', 'resultado'].every((id) => leer('app/navegacion/menu.config.js').includes(id));
  return {
    nombre: 'ui-flujo-etapas',
    ok: faltantes.length === 0 && flujoMenuOk,
    idsRequeridos: IDS_UI_ETAPAS.length,
    faltantes,
    flujoMenuOk
  };
}

function verificarPackage() {
  const errores = [];
  let scripts = {};
  try {
    const pkg = JSON.parse(leer('package.json'));
    scripts = pkg.scripts || {};
    if (!scripts['check:bloque18-autovideo']) errores.push('Falta script check:bloque18-autovideo.');
    if (!scripts['check:autovideo']) errores.push('Falta script check:autovideo.');
    if (!pkg.build?.files?.includes('etapas/**/*')) errores.push('build.files no incluye etapas/**/* para empaquetado.');
    if (!pkg.build?.files?.includes('diagnostico/**/*')) errores.push('build.files no incluye diagnostico/**/* para empaquetado.');
  } catch (error) {
    errores.push(`No se pudo leer package.json: ${error.message}`);
  }
  return {
    nombre: 'package-final',
    ok: errores.length === 0,
    errores,
    scriptsClave: ['check:bloque18-autovideo', 'check:autovideo', 'start']
  };
}

function crearMatrizEtapas() {
  return [
    { etapa: 'nuevo-proyecto', backend: 'server/rutas-etapas.service.js', ui: 'app/pantallas/nuevo-proyecto.view.js', estado: 'conectado' },
    { etapa: 'entendimiento', backend: 'entender/etapas/entendimiento-etapa.service.js', ui: 'app/pantallas/entendimiento.view.js', estado: 'conectado' },
    { etapa: 'plan-edicion', backend: 'etapas/02-plan/procesar-plan-edicion.service.js', ui: 'app/pantallas/plan-edicion.view.js', estado: 'conectado' },
    { etapa: 'produccion', backend: 'etapas/03-produccion/procesar-produccion-maestro.service.js', ui: 'app/pantallas/produccion.view.js', estado: 'conectado' },
    { etapa: 'adaptacion', backend: 'etapas/04-adaptacion/procesar-adaptacion-plataformas.service.js', ui: 'app/pantallas/adaptacion.view.js', estado: 'conectado' },
    { etapa: 'resultado', backend: 'etapas/05-resultado/procesar-resultado-final.service.js', ui: 'app/pantallas/resultado.view.js', estado: 'conectado' }
  ].map((item) => ({ ...item, ok: existe(item.backend) && existe(item.ui) }));
}

function crearRecomendaciones({ errores = [], advertencias = [] } = {}) {
  if (errores.length) return ['Corregir los errores bloqueantes antes de procesar un proyecto completo.', 'Ejecutar node scripts/verificar-bloque-18-autovideo.js después de corregir.'];
  if (advertencias.length) return ['El rediseño está operativo, pero conviene revisar advertencias antes de empaquetar.'];
  return ['Rediseño por etapas listo. Ejecutar flujo real: Nuevo proyecto → Entendimiento → Plan → Producción → Adaptación → Resultado final.'];
}

export async function crearDiagnosticoFinalRedisenio(opciones = {}) {
  const inicio = Date.now();
  const revisiones = [
    crearRevisionArchivos('backend-flujo-final', ARCHIVOS_FLUJO_FINAL),
    crearRevisionArchivos('ui-flujo-final', ARCHIVOS_UI_FINAL),
    crearRevisionArchivos('scripts-verificadores', SCRIPTS_BLOQUES),
    crearRevisionArchivos('documentacion-bloques', DOCS_BLOQUES),
    verificarRutasApi(),
    verificarUiEtapas(),
    verificarPackage()
  ];
  const matrizEtapas = crearMatrizEtapas();
  const errores = [];
  const advertencias = [];

  revisiones.forEach((revision) => {
    if (!revision.ok) {
      if (revision.faltantes?.length) errores.push(`${revision.nombre}: faltan ${revision.faltantes.join(', ')}`);
      if (revision.errores?.length) errores.push(...revision.errores.map((item) => `${revision.nombre}: ${item}`));
      if (revision.flujoMenuOk === false) errores.push('ui-flujo-etapas: el menú no contiene el flujo completo.');
    }
  });
  matrizEtapas.filter((item) => !item.ok).forEach((item) => errores.push(`Matriz de etapas incompleta: ${item.etapa}`));

  const diagnostico = {
    ok: errores.length === 0,
    bloqueante: errores.length > 0,
    tipo: 'diagnostico-final-redisenio',
    bloque: 18,
    version: '1.0.0',
    mensaje: errores.length ? `Diagnóstico final encontró ${errores.length} problema(s).` : 'Diagnóstico final correcto: rediseño por etapas cerrado.',
    resumen: {
      bloquesRevisados: 18,
      etapasConectadas: matrizEtapas.filter((item) => item.ok).length,
      etapasTotales: matrizEtapas.length,
      archivosBackend: ARCHIVOS_FLUJO_FINAL.length,
      archivosUi: ARCHIVOS_UI_FINAL.length,
      scriptsVerificadores: SCRIPTS_BLOQUES.length,
      docs: DOCS_BLOQUES.length,
      rutasApi: RUTAS_API_ETAPAS.length
    },
    matrizEtapas,
    revisiones,
    errores,
    advertencias,
    recomendaciones: crearRecomendaciones({ errores, advertencias }),
    duracionMs: Date.now() - inicio,
    creadoEn: new Date().toISOString()
  };

  if (opciones.guardarReporte) {
    const rutaReporte = path.join(obtenerRutaDatos(), 'diagnosticos', 'diagnostico-final-redisenio.json');
    await escribirJson(rutaReporte, diagnostico);
    return { ...diagnostico, rutaReporte };
  }

  return diagnostico;
}

export default crearDiagnosticoFinalRedisenio;
