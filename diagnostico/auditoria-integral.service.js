/*
  Bloque 8
  Funcion: auditoria integral de variables, conexiones, botones, entradas, salidas y motor de efectos.
*/

import fs from 'fs';
import path from 'path';
import { escribirJson, obtenerRutaDatos, obtenerRutaRaiz } from '../comun/archivos.js';

const EXCLUIR_DIRS = new Set(['.git', 'node_modules', 'release', 'dist', 'datos']);

const ARCHIVOS_CRITICOS = Object.freeze([
  'app/index.html',
  'app/app.js',
  'app/configuracion-proyecto-ui.js',
  'app/efectos-ui.js',
  'app/resultado-efectos-ui.js',
  'app/biblioteca-ui.js',
  'app/historial-proyectos-ui.js',
  'app/produccion-revision-ui.js',
  'app/diagnostico-fuerte-ui.js',
  'app/auditoria-integral-ui.js',
  'app/error-modal.js',
  'server.js',
  'server/rutas-modulares.service.js',
  'motor/flujo-principal.js',
  'motor/flujo-modular-autovideo.service.js',
  'editar/efectos/catalogo/index.js',
  'editar/efectos/analisis/index.js',
  'editar/efectos/planificador/index.js',
  'editar/efectos/ffmpeg/index.js',
  'editar/efectos/efectos.conexion.js',
  'diagnostico/efectos/diagnostico-efectos.service.js',
  'diagnostico/diagnostico-fuerte.service.js',
  'diagnostico/auditoria-integral.service.js',
  'diagnostico/reintento-etapa.service.js',
  'gemini/cliente-gemini.service.js',
  'exportacion/renderizar-plataformas-pendientes.service.js',
  'package.json'
]);

const IDS_REQUERIDOS = Object.freeze([
  'serverStatus', 'videoForm', 'videoInput', 'fileName', 'processButton', 'progressArea', 'progressText', 'progressTitle', 'progressPercent', 'progressBar', 'progressHistory', 'messageBox', 'resultPanel', 'resultVideo', 'downloadLink', 'improveAudio', 'audioMode', 'platformInput', 'modeInput', 'editingSummary', 'audioSummary', 'transcriptionSummary', 'modularSummary', 'productionSummary', 'resultPlatformsPanel', 'resultPlatformsSummary', 'resultPlatformsList', 'beforeAfterPanel', 'beforeAfterSummary', 'beforeVideo', 'afterVideo', 'errorModal', 'errorModalTitle', 'errorModalStage', 'errorModalDetail', 'errorModalFile', 'errorModalRecommendation', 'closeErrorModal', 'mainNavigation', 'pantallaDinamica', 'profileSelect', 'editModeSelect', 'exportMultiplatform', 'projectSettingsSummary', 'historyProjectsList', 'historyProjectsSummary', 'historyProjectsStatus', 'productionProjectIdInput', 'productionReviewList', 'productionReviewSummary', 'productionReviewStatus', 'libraryResourcesList', 'libraryResourcesSummary', 'libraryStatus', 'strongDiagnosticResult', 'strongDiagnosticStatus', 'integralAuditResult', 'integralAuditStatus'
]);

const CAMPOS_FORMULARIO = Object.freeze([
  'video', 'jobId', 'perfil', 'plataforma', 'plataformas', 'modoEdicion', 'exportarMultiplataforma', 'modo', 'mejorarAudio', 'modoAudio', 'crearTranscripcion', 'modoTranscripcion', 'idiomaTranscripcion', 'textoTranscripcionManual', 'usarGemini', 'usarFallbackGemini', 'geminiCredencial', 'geminiModelo', 'geminiGuia', 'geminiTemperatura', 'usarMotorEfectos', 'selectorEfectos', 'intensidadEfectos', 'maxEfectosVisuales'
]);

const RUTAS_API_REQUERIDAS = Object.freeze([
  '/api/estado',
  '/api/procesar-video',
  '/api/progreso/:jobId',
  '/api/autovideo/proyectos',
  '/api/autovideo/biblioteca',
  '/api/autovideo/biblioteca/categorias',
  '/api/autovideo/diagnostico/fuerte',
  '/api/autovideo/diagnostico/auditoria-integral',
  '/api/autovideo/reintento/plan',
  '/api/autovideo/aprendizaje',
  '/api/autovideo/gemini/config'
]);

const ACCIONES_REQUERIDAS = Object.freeze([
  'data-history-action="reload"',
  'data-production-action="reload"',
  'data-production-action="save"',
  'data-production-mark="aprobar"',
  'data-production-mark="no-usar"',
  'data-production-mark="pendiente"',
  'data-production-replace',
  'data-library-action="reload"',
  'data-library-action="save"',
  'data-diagnostic-action="strong"',
  'data-diagnostic-action="audit"',
  'data-platform-option'
]);

const ARCHIVOS_MOTOR_EFECTOS = Object.freeze([
  'editar/efectos/catalogo/efectos.catalogo.js',
  'editar/efectos/catalogo/efectos.schema.js',
  'editar/efectos/analisis/contexto-video-efectos.service.js',
  'editar/efectos/planificador/planificar-efectos.service.js',
  'editar/efectos/planificador/seleccionar-efectos-local.service.js',
  'editar/efectos/planificador/seleccionar-efectos-gemini.service.js',
  'editar/efectos/ffmpeg/compilar-plan-ffmpeg.service.js',
  'editar/efectos/ffmpeg/compilar-efecto-ffmpeg.service.js',
  'editar/efectos/efectos.conexion.js',
  'diagnostico/efectos/diagnostico-efectos.service.js'
]);

function listarArchivos(dir, salida = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUIR_DIRS.has(item.name)) continue;
    const ruta = path.join(dir, item.name);
    if (item.isDirectory()) listarArchivos(ruta, salida);
    else salida.push(ruta);
  }
  return salida;
}

function leer(relativo) { return fs.readFileSync(path.join(obtenerRutaRaiz(), relativo), 'utf-8'); }
function relativo(ruta) { return path.relative(obtenerRutaRaiz(), ruta).replace(/\\/g, '/'); }
function existeRelativo(ruta) { return fs.existsSync(path.join(obtenerRutaRaiz(), ruta)); }
function obtenerArchivosTexto() { return listarArchivos(obtenerRutaRaiz()).filter((archivo) => /\.(js|html|css|json|md)$/.test(archivo)); }
function obtenerArchivosApp() { return obtenerArchivosTexto().filter((archivo) => relativo(archivo).startsWith('app/')); }

function extraerIds(contenido) {
  const ids = new Set();
  const regexes = [/id=["']([^"']+)["']/g, /\.id\s*=\s*["']([^"']+)["']/g];
  regexes.forEach((regex) => { let match; while ((match = regex.exec(contenido))) ids.add(match[1]); });
  return ids;
}

function extraerGetElementIds(contenido) {
  const ids = new Set();
  const regex = /getElementById\(\s*["']([^"']+)["']\s*\)/g;
  let match;
  while ((match = regex.exec(contenido))) ids.add(match[1]);
  return ids;
}

function extraerImports(contenido) {
  const imports = [];
  const regex = /import\s+(?:[^'";]+?\s+from\s+)?["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(contenido))) imports.push(match[1]);
  return imports;
}

function resolverImport(rutaArchivo, importPath) {
  if (!importPath.startsWith('.')) return null;
  const base = path.resolve(path.dirname(rutaArchivo), importPath);
  const candidatos = [base, `${base}.js`, path.join(base, 'index.js')];
  return candidatos.find((candidato) => fs.existsSync(candidato)) || base;
}

function auditarArchivosCriticos() {
  const faltantes = ARCHIVOS_CRITICOS.filter((archivo) => !existeRelativo(archivo));
  return { ok: faltantes.length === 0, total: ARCHIVOS_CRITICOS.length, faltantes };
}

function auditarImports() {
  const errores = [];
  const archivos = obtenerArchivosTexto().filter((archivo) => archivo.endsWith('.js'));
  archivos.forEach((archivo) => {
    const contenido = fs.readFileSync(archivo, 'utf-8');
    extraerImports(contenido).forEach((importPath) => {
      const resuelto = resolverImport(archivo, importPath);
      if (resuelto && !fs.existsSync(resuelto)) errores.push(`${relativo(archivo)} importa ${importPath}, pero no existe.`);
    });
  });
  return { ok: errores.length === 0, totalArchivos: archivos.length, errores };
}

function auditarIds() {
  const archivos = obtenerArchivosApp();
  const idsDeclarados = new Set();
  const idsUsados = new Set();
  archivos.forEach((archivo) => {
    const contenido = fs.readFileSync(archivo, 'utf-8');
    extraerIds(contenido).forEach((id) => idsDeclarados.add(id));
    extraerGetElementIds(contenido).forEach((id) => idsUsados.add(id));
  });
  const faltantesRequeridos = IDS_REQUERIDOS.filter((id) => !idsDeclarados.has(id));
  const usadosSinDeclarar = [...idsUsados].filter((id) => !idsDeclarados.has(id));
  return { ok: faltantesRequeridos.length === 0 && usadosSinDeclarar.length === 0, declarados: idsDeclarados.size, usados: idsUsados.size, faltantesRequeridos, usadosSinDeclarar };
}

function auditarScriptsIndex() {
  const html = leer('app/index.html');
  const faltantes = [];
  const refs = [];
  const regex = /(?:src|href)=["']\.\/([^"']+)["']/g;
  let match;
  while ((match = regex.exec(html))) refs.push(match[1]);
  refs.forEach((ref) => { if (!fs.existsSync(path.join(obtenerRutaRaiz(), 'app', ref))) faltantes.push(ref); });
  return { ok: faltantes.length === 0, referencias: refs.length, faltantes };
}

function auditarFormularioYServidor() {
  const fuenteFormulario = obtenerArchivosApp().filter((archivo) => archivo.endsWith('.js')).map((archivo) => fs.readFileSync(archivo, 'utf-8')).join('\n');
  const server = leer('server.js');
  const faltanEnFormulario = CAMPOS_FORMULARIO.filter((campo) => campo !== 'video' && !fuenteFormulario.includes(`'${campo}'`) && !fuenteFormulario.includes(`"${campo}"`) && !fuenteFormulario.includes(campo));
  const faltanEnServidor = CAMPOS_FORMULARIO.filter((campo) => campo === 'video' ? false : !server.includes(campo));
  return { ok: faltanEnFormulario.length === 0 && faltanEnServidor.length === 0, campos: CAMPOS_FORMULARIO.length, faltanEnFormulario, faltanEnServidor };
}

function auditarRutasApi() {
  const server = `${leer('server.js')}\n${leer('server/rutas-modulares.service.js')}`;
  const faltantes = RUTAS_API_REQUERIDAS.filter((ruta) => !server.includes(ruta));
  return { ok: faltantes.length === 0, total: RUTAS_API_REQUERIDAS.length, faltantes };
}

function auditarAccionesBotones() {
  const fuente = obtenerArchivosApp().map((archivo) => fs.readFileSync(archivo, 'utf-8')).join('\n');
  const faltantes = ACCIONES_REQUERIDAS.filter((accion) => !fuente.includes(accion));
  const manejadores = ['data-history-action', 'data-production-action', 'data-production-mark', 'data-production-replace', 'data-library-action', 'data-diagnostic-action', 'data-platform-option'].filter((accion) => fuente.includes(accion));
  return { ok: faltantes.length === 0 && manejadores.length >= 7, total: ACCIONES_REQUERIDAS.length, manejadores: manejadores.length, faltantes };
}

function auditarMotorEfectos() {
  const faltantes = ARCHIVOS_MOTOR_EFECTOS.filter((archivo) => !existeRelativo(archivo));
  const verificaciones = [];
  const catalogo = existeRelativo('editar/efectos/catalogo/efectos.catalogo.js') ? leer('editar/efectos/catalogo/efectos.catalogo.js') : '';
  const conexion = existeRelativo('editar/efectos/efectos.conexion.js') ? leer('editar/efectos/efectos.conexion.js') : '';
  const app = existeRelativo('app/app.js') ? leer('app/app.js') : '';
  const server = existeRelativo('server.js') ? leer('server.js') : '';

  if (!catalogo.includes('CATALOGO_EFECTOS')) verificaciones.push('No se detecta CATALOGO_EFECTOS.');
  if (!conexion.includes('planificarEfectos') || !conexion.includes('compilarPlanFfmpeg')) verificaciones.push('La conexión de efectos no integra planificador y compilador.');
  if (!app.includes('obtenerOpcionesEfectos')) verificaciones.push('La interfaz no envía opciones de efectos.');
  if (!server.includes('maxEfectosVisuales') || !server.includes('selectorEfectos')) verificaciones.push('El servidor no normaliza opciones de efectos.');

  return {
    ok: faltantes.length === 0 && verificaciones.length === 0,
    archivos: ARCHIVOS_MOTOR_EFECTOS.length,
    faltantes,
    errores: verificaciones
  };
}

function auditarPackage() {
  const pkg = JSON.parse(leer('package.json'));
  const scripts = pkg.scripts || {};
  const requeridos = ['check:autovideo', 'check:auditoria-integral-autovideo', 'check:bloque21-autovideo', 'release:win', 'dist:win', 'start'];
  const faltantes = requeridos.filter((script) => !scripts[script]);
  return { ok: faltantes.length === 0, version: pkg.version, faltantes };
}

export async function crearAuditoriaIntegral(opciones = {}) {
  const secciones = {
    archivos: auditarArchivosCriticos(),
    imports: auditarImports(),
    ids: auditarIds(),
    index: auditarScriptsIndex(),
    formularioServidor: auditarFormularioYServidor(),
    rutasApi: auditarRutasApi(),
    botonesAcciones: auditarAccionesBotones(),
    motorEfectos: auditarMotorEfectos(),
    packageJson: auditarPackage()
  };
  const errores = Object.entries(secciones).flatMap(([nombre, resultado]) => {
    const partes = [];
    ['faltantes', 'errores', 'faltantesRequeridos', 'usadosSinDeclarar', 'faltanEnFormulario', 'faltanEnServidor'].forEach((clave) => {
      if (Array.isArray(resultado[clave])) partes.push(...resultado[clave].map((item) => `${nombre}: ${item}`));
    });
    return partes;
  });
  const ok = Object.values(secciones).every((seccion) => seccion.ok) && errores.length === 0;
  const auditoria = {
    ok,
    bloqueante: !ok,
    tipo: 'auditoria-integral-autovideo',
    version: '1.1.0',
    mensaje: ok ? 'Auditoria integral correcta.' : `Auditoria integral encontro ${errores.length} problema(s).`,
    secciones,
    errores,
    recomendaciones: ok ? ['Probar flujo real con video corto en Electron y revisar diagnostico-efectos.json.'] : ['Corregir errores listados antes de empaquetar o procesar videos largos.'],
    creadoEn: new Date().toISOString()
  };
  if (opciones.guardarReporte) {
    const rutaReporte = path.join(obtenerRutaDatos(), 'diagnosticos', 'auditoria-integral-autovideo.json');
    await escribirJson(rutaReporte, auditoria);
    return { ...auditoria, rutaReporte };
  }
  return auditoria;
}

export default crearAuditoriaIntegral;
