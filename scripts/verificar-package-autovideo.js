import fs from 'fs';

const SCRIPTS_REQUERIDOS = [
  'check:bloque1-autovideo',
  'check:bloque2-autovideo',
  'check:bloque3-autovideo',
  'check:bloque4-autovideo',
  'check:bloque5-autovideo',
  'check:bloque6-autovideo',
  'check:bloque7-autovideo',
  'check:bloque8-autovideo',
  'check:bloque9-autovideo',
  'check:bloque10-autovideo',
  'check:bloque11-autovideo',
  'check:bloque12-autovideo',
  'check:bloque13-autovideo',
  'check:bloque14-autovideo',
  'check:bloque15-autovideo',
  'check:bloque16-autovideo',
  'check:bloque17-autovideo',
  'check:bloque18-autovideo',
  'check:bloque19-autovideo',
  'check:diagnostico-fuerte',
  'check:biblioteca-ui',
  'check:produccion-reemplazo-ui',
  'check:gemini-real-perfil',
  'check:render-plataformas',
  'check:configuracion-proyecto-ui',
  'check:historial-proyectos-ui',
  'check:produccion-revision-ui',
  'check:produccion-acciones-ui',
  'check:autovideo'
];

const BUILD_REQUERIDOS = [
  'app/**/*',
  'aprendizaje/**/*',
  'biblioteca/**/*',
  'biblioteca-proyecto/**/*',
  'diagnostico/**/*',
  'exportacion/**/*',
  'gemini/**/*',
  'produccion/**/*',
  'recursos-externos/**/*',
  'server/**/*',
  'subtitulos/**/*',
  'textos/**/*',
  'visual/**/*'
];

function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const scripts = pkg.scripts || {};
  const files = pkg.build?.files || [];
  const faltanScripts = SCRIPTS_REQUERIDOS.filter((script) => !scripts[script]);
  const faltanBuild = BUILD_REQUERIDOS.filter((item) => !files.includes(item));
  if (faltanScripts.length || faltanBuild.length) throw new Error(`Faltan scripts: ${faltanScripts.join(', ') || 'ninguno'} | Faltan build files: ${faltanBuild.join(', ') || 'ninguno'}`);
  console.log('OK package AutoVideoJeff:', pkg.version, SCRIPTS_REQUERIDOS.length, 'scripts clave');
}

try {
  main();
} catch (error) {
  console.error('ERROR package AutoVideoJeff:', error.message);
  process.exit(1);
}
