import fs from 'fs';

const ARCHIVOS_REQUERIDOS = Object.freeze([
  'editar/efectos/catalogo/index.js',
  'editar/efectos/analisis/index.js',
  'editar/efectos/planificador/index.js',
  'editar/efectos/ffmpeg/index.js',
  'editar/efectos/optimizador/index.js',
  'editar/efectos/aprendizaje/index.js',
  'editar/efectos/presets/index.js',
  'editar/efectos/previsualizacion/index.js',
  'editar/efectos/efectos.conexion.js',
  'diagnostico/efectos/diagnostico-efectos.service.js',
  'app/efectos-ui.js',
  'app/resultado-efectos-ui.js',
  'server/rutas-modulares.service.js',
  'docs/efectos-automaticos.md'
]);

const SCRIPTS_REQUERIDOS = Object.freeze([
  'check:efectos-catalogo',
  'check:efectos-presets',
  'check:efectos-aprendizaje',
  'check:efectos-optimizador',
  'check:efectos-plan',
  'check:efectos-render',
  'check:efectos-integracion',
  'check:efectos-preview',
  'check:efectos'
]);

const MARCAS_PLANIFICADOR = Object.freeze([
  'aplicarPresetVisualAContexto',
  'aplicarPresetVisualASeleccion',
  'aplicarAprendizajeEfectos',
  'optimizarPlanEfectos',
  'validarPlanEfectos'
]);

const RUTAS_API = Object.freeze([
  '/api/autovideo/efectos/catalogo',
  '/api/autovideo/efectos/presets',
  '/api/autovideo/efectos/aprendizaje',
  '/api/autovideo/efectos/previsualizar'
]);

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function existe(ruta) {
  return fs.existsSync(ruta);
}

function validarArchivos() {
  const faltantes = ARCHIVOS_REQUERIDOS.filter((ruta) => !existe(ruta));
  exigir(faltantes.length === 0, `Faltan archivos del motor de efectos: ${faltantes.join(', ')}`);
}

function validarPlanificador() {
  const contenido = leer('editar/efectos/planificador/planificar-efectos.service.js');
  const faltantes = MARCAS_PLANIFICADOR.filter((marca) => !contenido.includes(marca));
  exigir(faltantes.length === 0, `Planificador no tiene piezas finales: ${faltantes.join(', ')}`);
}

function validarServidor() {
  const contenido = leer('server/rutas-modulares.service.js');
  const faltantes = RUTAS_API.filter((ruta) => !contenido.includes(ruta));
  exigir(faltantes.length === 0, `Servidor no expone rutas de efectos: ${faltantes.join(', ')}`);
}

function validarPackage() {
  const pkg = JSON.parse(leer('package.json'));
  const scripts = pkg.scripts || {};
  const faltantes = SCRIPTS_REQUERIDOS.filter((script) => !scripts[script]);
  exigir(faltantes.length === 0, `Faltan scripts de verificacion: ${faltantes.join(', ')}`);
}

function validarUi() {
  const ui = leer('app/efectos-ui.js');
  const resultado = leer('app/resultado-efectos-ui.js');
  exigir(ui.includes('previewEffectsButton'), 'La UI no tiene boton de previsualizacion.');
  exigir(ui.includes('obtenerOpcionesEfectos'), 'La UI no entrega opciones de efectos al formulario.');
  exigir(resultado.includes('obtenerResumenEfectos'), 'No existe resumen de efectos para resultado final.');
}

function main() {
  validarArchivos();
  validarPlanificador();
  validarServidor();
  validarPackage();
  validarUi();
  console.log('OK cierre final efectos: arquitectura, UI, API, scripts y planificador conectados.');
}

try {
  main();
} catch (error) {
  console.error('ERROR cierre final efectos:', error.message);
  process.exit(1);
}
