/*
  Revision completa de funcionamiento AutoVideoJeff.
  Verifica pantallas, formulario, servidor, rutas, botones, modulos y scripts principales.
*/

import fs from 'fs';
import path from 'path';

const raiz = process.cwd();
const leer = (archivo) => fs.readFileSync(path.join(raiz, archivo), 'utf-8');
const existe = (archivo) => fs.existsSync(path.join(raiz, archivo));

const ARCHIVOS_CRITICOS = [
  'app/index.html',
  'app/app.js',
  'app/navegacion/navegacion.service.js',
  'app/navegacion/navegacion-bootstrap.js',
  'app/pantallas/inicio.view.js',
  'app/pantallas/nuevo-proyecto.view.js',
  'app/pantallas/biblioteca.view.js',
  'app/pantallas/produccion.view.js',
  'app/pantallas/historial.view.js',
  'app/pantallas/perfiles.view.js',
  'app/pantallas/ajustes.view.js',
  'app/pantallas/diagnostico.view.js',
  'app/configuracion-proyecto-ui.js',
  'app/biblioteca-ui.js',
  'app/produccion-revision-ui.js',
  'app/historial-proyectos-ui.js',
  'app/diagnostico-fuerte-ui.js',
  'app/auditoria-integral-ui.js',
  'server.js',
  'server/rutas-modulares.service.js',
  'motor/flujo-principal.js',
  'motor/flujo-modular-autovideo.service.js',
  'gemini/gemini.conexion.js',
  'produccion/produccion.conexion.js',
  'biblioteca/biblioteca.conexion.js',
  'package.json'
];

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function revisarArchivosCriticos() {
  const faltantes = ARCHIVOS_CRITICOS.filter((archivo) => !existe(archivo));
  exigir(!faltantes.length, `Faltan archivos criticos: ${faltantes.join(', ')}`);
  return { ok: true, total: ARCHIVOS_CRITICOS.length };
}

function revisarPantallasSeparadas() {
  const index = leer('app/index.html');
  const css = leer('app/styles.css');
  const nav = leer('app/navegacion/navegacion.service.js');
  const inicio = leer('app/pantallas/inicio.view.js');
  const vistasSinProcesador = [
    'app/pantallas/inicio.view.js',
    'app/pantallas/biblioteca.view.js',
    'app/pantallas/produccion.view.js',
    'app/pantallas/historial.view.js',
    'app/pantallas/perfiles.view.js',
    'app/pantallas/ajustes.view.js',
    'app/pantallas/diagnostico.view.js'
  ];

  exigir(index.includes('id="nuevoProyectoProcessor"'), 'Falta panel nuevoProyectoProcessor.');
  exigir(index.includes('data-screen-panel="nuevo-proyecto"'), 'El procesador no esta asignado a Nuevo proyecto.');
  exigir(css.includes('.aj-screen-panel { display: none; }'), 'El procesador no se oculta por defecto.');
  exigir(css.includes('body[data-pantalla-activa="nuevo-proyecto"]'), 'El procesador no se muestra solo en Nuevo proyecto.');
  exigir(nav.includes('document.body.dataset.pantallaActiva'), 'La navegacion no marca pantalla activa.');
  exigir(inicio.includes('Sin procesador aquí') || inicio.includes('Sin procesador aqui'), 'Inicio no deja claro que no procesa video.');

  const mezcladas = vistasSinProcesador.filter((archivo) => /videoForm|videoInput|processButton|Seleccionar video/.test(leer(archivo)));
  exigir(!mezcladas.length, `Pantallas mezcladas con procesador: ${mezcladas.join(', ')}`);
  return { ok: true, pantallasSeparadas: vistasSinProcesador.length + 1 };
}

function revisarFormularioNuevoProyecto() {
  const index = leer('app/index.html');
  const app = leer('app/app.js');
  const ids = [
    'videoForm', 'videoInput', 'fileName', 'profileSelect', 'editModeSelect', 'exportMultiplatform',
    'platformInput', 'modeInput', 'improveAudio', 'audioMode', 'createTranscription', 'addSubtitles',
    'addFloatingTexts', 'manualTranscriptText', 'processButton', 'progressArea', 'messageBox',
    'resultPanel', 'resultVideo', 'downloadLink', 'resultPlatformsPanel', 'beforeAfterPanel'
  ];
  const faltantes = ids.filter((id) => !index.includes(`id="${id}"`));
  exigir(!faltantes.length, `Faltan IDs del formulario: ${faltantes.join(', ')}`);
  exigir(index.includes('data-platform-option'), 'Faltan checkboxes de plataformas.');
  exigir(app.includes("const PANTALLA_PROCESADOR = 'nuevo-proyecto'"), 'app.js no define pantalla del procesador.');
  exigir(app.includes('if (!esPantallaProcesadorActiva()) return;'), 'app.js no bloquea procesamiento fuera de Nuevo proyecto.');
  exigir(app.includes('aplicarOpcionesProyectoAFormulario(formulario)'), 'El formulario no agrega perfil/plataformas.');
  exigir(app.includes('obtenerOpcionesTranscripcion()'), 'El formulario no agrega transcripcion/subtitulos.');
  exigir(app.includes('obtenerConfiguracionGemini()'), 'El formulario no agrega Gemini.');
  return { ok: true, ids: ids.length };
}

function revisarRutasServidor() {
  const server = `${leer('server.js')}\n${leer('server/rutas-modulares.service.js')}`;
  const rutas = [
    '/api/estado',
    '/api/procesar-video',
    '/api/progreso/:jobId',
    '/api/autovideo/proyectos',
    '/api/autovideo/biblioteca',
    '/api/autovideo/proyectos/:proyectoId/produccion',
    '/api/autovideo/aprendizaje',
    '/api/autovideo/diagnostico/fuerte',
    '/api/autovideo/diagnostico/auditoria-integral',
    '/api/autovideo/gemini/config'
  ];
  const faltantes = rutas.filter((ruta) => !server.includes(ruta));
  exigir(!faltantes.length, `Faltan rutas del servidor: ${faltantes.join(', ')}`);
  return { ok: true, rutas: rutas.length };
}

function revisarPantallasFuncionales() {
  const comprobaciones = [
    ['app/biblioteca-ui.js', ['recargarBibliotecaUI', '/api/autovideo/biblioteca', 'data-library-action']],
    ['app/produccion-revision-ui.js', ['recargarProduccionRevisionUI', 'aplicarReemplazoProduccionUI', '/api/autovideo/aprendizaje']],
    ['app/historial-proyectos-ui.js', ['recargarHistorialProyectosUI', '/api/autovideo/proyectos']],
    ['app/diagnostico-fuerte-ui.js', ['ejecutarDiagnosticoFuerteUI', '/api/autovideo/diagnostico/fuerte']],
    ['app/auditoria-integral-ui.js', ['ejecutarAuditoriaIntegralUI', '/api/autovideo/diagnostico/auditoria-integral']],
    ['app/configuracion-proyecto-ui.js', ['obtenerOpcionesProyecto', 'data-platform-option', 'profileSelect']]
  ];

  comprobaciones.forEach(([archivo, marcas]) => {
    const contenido = leer(archivo);
    const faltantes = marcas.filter((marca) => !contenido.includes(marca));
    exigir(!faltantes.length, `${archivo} incompleto. Faltan: ${faltantes.join(', ')}`);
  });
  return { ok: true, pantallas: comprobaciones.length };
}

function revisarModulosMotor() {
  const flujo = leer('motor/flujo-principal.js');
  const modular = leer('motor/flujo-modular-autovideo.service.js');
  const gemini = leer('gemini/gemini.conexion.js');

  exigir(flujo.includes('crearIntegracionModularAutoVideoJeff'), 'Flujo principal no llama integracion modular.');
  exigir(flujo.includes('renderizarPlataformasPendientes'), 'Flujo principal no llama render multiplataforma.');
  exigir(modular.includes('ejecutarPaqueteGeminiEdicion'), 'Flujo modular no ejecuta paquete Gemini.');
  exigir(modular.includes('crearPlanProduccion'), 'Flujo modular no crea plan de Produccion.');
  exigir(gemini.includes('crearPaqueteGeminiEdicion'), 'Gemini no crea paquete de edicion.');
  exigir(gemini.includes('prepararAnalisisTranscripcion'), 'Gemini no conecta analisis de transcripcion.');
  return { ok: true };
}

function revisarScriptsPackage() {
  const pkg = JSON.parse(leer('package.json'));
  const scripts = pkg.scripts || {};
  const requeridos = [
    'start',
    'check:opcion-a-pantallas-ui',
    'check:nuevo-proyecto-ui',
    'check:funcionamiento-completo-autovideo',
    'check:autovideo',
    'release:win'
  ];
  const faltantes = requeridos.filter((script) => !scripts[script]);
  exigir(!faltantes.length, `Faltan scripts package: ${faltantes.join(', ')}`);
  return { ok: true, scripts: requeridos.length };
}

try {
  const resumen = {
    archivos: revisarArchivosCriticos(),
    pantallas: revisarPantallasSeparadas(),
    formulario: revisarFormularioNuevoProyecto(),
    servidor: revisarRutasServidor(),
    pantallasFuncionales: revisarPantallasFuncionales(),
    motor: revisarModulosMotor(),
    package: revisarScriptsPackage()
  };
  console.log('OK revision completa funcionamiento AutoVideoJeff:', JSON.stringify(resumen, null, 2));
} catch (error) {
  console.error('ERROR revision completa funcionamiento AutoVideoJeff:', error.message);
  process.exit(1);
}
