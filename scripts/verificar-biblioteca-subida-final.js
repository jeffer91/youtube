/*
  Revision final de subida - Biblioteca AutoVideoJeff
  Objetivo:
  - Confirmar que todos los archivos nuevos de biblioteca estan versionados en Git.
  - Confirmar que package.json contiene los scripts de verificacion.
  - Confirmar que el build incluye biblioteca y biblioteca-proyecto.
  - Ejecutar la verificacion integral completa.
*/

import fs from 'fs';
import { spawnSync } from 'child_process';

const ARCHIVOS_ESPERADOS = [
  'biblioteca/biblioteca.config.js',
  'biblioteca/biblioteca.conexion.js',
  'biblioteca/recurso.modelo.js',
  'biblioteca/rutas-biblioteca.service.js',
  'biblioteca/guardar-recurso.service.js',
  'biblioteca/analizar-recurso.service.js',
  'biblioteca/resolver-biblioteca-plan.service.js',
  'biblioteca/seleccionar-recursos-produccion.service.js',
  'biblioteca-proyecto/biblioteca-proyecto.conexion.js',
  'biblioteca-proyecto/guardar-recurso-proyecto.service.js',
  'biblioteca-proyecto/listar-recursos-proyecto.service.js',
  'app/pantallas/biblioteca.view.js',
  'app/pantallas/biblioteca-proyecto.view.js',
  'app/biblioteca-ui.js',
  'app/biblioteca-ui.css',
  'app/biblioteca-proyecto-ui.js',
  'app/biblioteca-proyecto.css',
  'app/etapas-ui/plan-edicion-ui.js',
  'app/pantallas/plan-edicion.view.js',
  'server/rutas-etapas.service.js',
  'server/rutas-modulares.service.js',
  'etapas/02-plan/procesar-plan-edicion.service.js',
  'scripts/verificar-biblioteca-bloque-1.js',
  'scripts/verificar-biblioteca-ui.js',
  'scripts/verificar-biblioteca-bloque-3.js',
  'scripts/verificar-biblioteca-bloque-4.js',
  'scripts/verificar-biblioteca-bloque-5.js',
  'scripts/verificar-biblioteca-integral.js',
  'scripts/verificar-biblioteca-subida-final.js'
];

const SCRIPTS_ESPERADOS = [
  'check:biblioteca-bloque1',
  'check:biblioteca-ui',
  'check:biblioteca-bloque3',
  'check:biblioteca-bloque4',
  'check:biblioteca-bloque5',
  'check:biblioteca-integral',
  'check:biblioteca-subida-final'
];

const ARCHIVOS_SINTAXIS = [
  'biblioteca/guardar-recurso.service.js',
  'biblioteca/analizar-recurso.service.js',
  'biblioteca/resolver-biblioteca-plan.service.js',
  'biblioteca-proyecto/guardar-recurso-proyecto.service.js',
  'app/biblioteca-ui.js',
  'app/biblioteca-proyecto-ui.js',
  'app/etapas-ui/plan-edicion-ui.js',
  'server/rutas-etapas.service.js',
  'etapas/02-plan/procesar-plan-edicion.service.js',
  'scripts/verificar-biblioteca-integral.js'
];

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function ejecutar(comando, args = [], opciones = {}) {
  return spawnSync(comando, args, {
    cwd: process.cwd(),
    encoding: 'utf-8',
    shell: false,
    ...opciones
  });
}

function ejecutarOk(comando, args = [], mensajeError = 'Comando fallido') {
  const resultado = ejecutar(comando, args);
  exigir(resultado.status === 0, `${mensajeError}: ${resultado.stderr || resultado.stdout || resultado.status}`);
  return resultado.stdout.trim();
}

function archivoExiste(ruta) {
  return fs.existsSync(ruta) && fs.statSync(ruta).isFile();
}

function verificarArchivosLocales() {
  const faltantes = ARCHIVOS_ESPERADOS.filter((ruta) => !archivoExiste(ruta));
  exigir(faltantes.length === 0, `Faltan archivos locales: ${faltantes.join(', ')}`);
  return { total: ARCHIVOS_ESPERADOS.length };
}

function verificarArchivosVersionados() {
  const versionados = [];
  const noVersionados = [];

  ARCHIVOS_ESPERADOS.forEach((ruta) => {
    const resultado = ejecutar('git', ['ls-files', '--error-unmatch', ruta]);
    if (resultado.status === 0) versionados.push(ruta);
    else noVersionados.push(ruta);
  });

  exigir(noVersionados.length === 0, `Archivos no versionados/subidos al repo: ${noVersionados.join(', ')}`);
  return { versionados: versionados.length };
}

function verificarPackage() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const scripts = pkg.scripts || {};
  const faltantes = SCRIPTS_ESPERADOS.filter((script) => !scripts[script]);
  exigir(faltantes.length === 0, `Faltan scripts en package.json: ${faltantes.join(', ')}`);

  const buildFiles = Array.isArray(pkg.build?.files) ? pkg.build.files.join(' ') : '';
  ['app/**/*', 'biblioteca/**/*', 'biblioteca-proyecto/**/*', 'server/**/*', 'scripts/**/*'].forEach((entrada) => {
    exigir(buildFiles.includes(entrada), `El build no incluye ${entrada}`);
  });

  return { scripts: SCRIPTS_ESPERADOS.length, buildOk: true };
}

function verificarSintaxis() {
  const resultados = ARCHIVOS_SINTAXIS.map((ruta) => {
    const resultado = ejecutar(process.execPath, ['--check', ruta]);
    exigir(resultado.status === 0, `Error de sintaxis en ${ruta}: ${resultado.stderr || resultado.stdout}`);
    return ruta;
  });
  return { archivos: resultados.length };
}

function verificarGitBasico() {
  const root = ejecutarOk('git', ['rev-parse', '--show-toplevel'], 'No se pudo leer raiz Git');
  const branch = ejecutarOk('git', ['branch', '--show-current'], 'No se pudo leer rama Git');
  const remoto = ejecutarOk('git', ['remote', 'get-url', 'origin'], 'No se pudo leer origin Git');
  exigir(remoto.includes('jeffer91') && remoto.includes('youtube'), `Origin no parece ser jeffer91/youtube: ${remoto}`);
  exigir(branch === 'main', `La rama actual debe ser main. Rama actual: ${branch}`);
  return { root, branch, remoto };
}

function ejecutarIntegral() {
  console.log('\n[Subida final] Ejecutando verificacion integral de biblioteca...');
  const resultado = spawnSync(process.execPath, ['scripts/verificar-biblioteca-integral.js'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, AUTOVIDEOJEFF_REVISION_SUBIDA_FINAL: '1' }
  });
  exigir(resultado.status === 0, `La verificacion integral fallo con codigo ${resultado.status}`);
  return { ok: true };
}

function revisarEstadoTrabajo() {
  const resultado = ejecutar('git', ['status', '--short']);
  const salida = (resultado.stdout || '').trim();
  return {
    limpio: salida.length === 0,
    nota: salida.length === 0
      ? 'Sin cambios locales pendientes.'
      : 'Hay cambios locales generados por pruebas o trabajo posterior. Revisa git status si necesitas subirlos.',
    detalle: salida
  };
}

async function main() {
  console.log('Iniciando revision final de subida de Biblioteca AutoVideoJeff...');

  const git = verificarGitBasico();
  const locales = verificarArchivosLocales();
  const versionados = verificarArchivosVersionados();
  const pkg = verificarPackage();
  const sintaxis = verificarSintaxis();
  const integral = ejecutarIntegral();
  const estadoTrabajo = revisarEstadoTrabajo();

  const resumen = {
    ok: true,
    repo: 'jeffer91/youtube',
    rama: git.branch,
    archivosLocales: locales.total,
    archivosVersionados: versionados.versionados,
    scriptsPackage: pkg.scripts,
    sintaxisVerificada: sintaxis.archivos,
    integral: integral.ok,
    estadoTrabajo,
    mensaje: 'Revision final completada: biblioteca subida, versionada y verificada.'
  };

  console.log('\nOK revision final subida biblioteca:', resumen);
}

main().catch((error) => {
  console.error('\nERROR revision final subida biblioteca:', error.message);
  process.exit(1);
});
