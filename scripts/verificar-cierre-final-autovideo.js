/*
  Bloque 20
  Verificacion final de cierre: estructura, scripts, diagnostico, UI y empaquetado.
*/

import fs from 'fs';

const ARCHIVOS_REQUERIDOS = [
  'package.json',
  'main.js',
  'preload.js',
  'server.js',
  'app/index.html',
  'app/app.js',
  'app/configuracion-proyecto-ui.js',
  'app/biblioteca-ui.js',
  'app/produccion-revision-ui.js',
  'app/diagnostico-fuerte-ui.js',
  'motor/flujo-principal.js',
  'motor/flujo-modular-autovideo.service.js',
  'gemini/cliente-gemini.service.js',
  'diagnostico/diagnostico-fuerte.service.js',
  'diagnostico/reintento-etapa.service.js',
  'exportacion/renderizar-plataformas-pendientes.service.js',
  'docs/AUTOVIDEO_BLOQUES_MODULARES.md',
  'docs/GUIA_FINAL_AUTOVIDEOJEFF.md'
];

const SCRIPTS_REQUERIDOS = [
  'start',
  'check:autovideo',
  'check:bloques-autovideo',
  'check:bloque19-autovideo',
  'check:bloque20-autovideo',
  'check:cierre-final-autovideo',
  'pack',
  'dist:win'
];

function verificarArchivos() {
  const faltantes = ARCHIVOS_REQUERIDOS.filter((archivo) => !fs.existsSync(archivo));
  if (faltantes.length) throw new Error(`Faltan archivos finales: ${faltantes.join(', ')}`);
}

function verificarPackage() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const scripts = pkg.scripts || {};
  const faltantes = SCRIPTS_REQUERIDOS.filter((script) => !scripts[script]);
  if (faltantes.length) throw new Error(`Faltan scripts finales: ${faltantes.join(', ')}`);
  if (pkg.version !== '1.0.0') throw new Error(`La version final debe ser 1.0.0 y es ${pkg.version}`);
  if (!pkg.build?.files?.includes('app/**/*')) throw new Error('build.files debe incluir app/**/*');
  if (!pkg.build?.files?.includes('diagnostico/**/*')) throw new Error('build.files debe incluir diagnostico/**/*');
}

function verificarDocumentacion() {
  const guia = fs.readFileSync('docs/GUIA_FINAL_AUTOVIDEOJEFF.md', 'utf-8');
  const bloques = fs.readFileSync('docs/AUTOVIDEO_BLOQUES_MODULARES.md', 'utf-8');
  if (!guia.includes('npm run check:autovideo')) throw new Error('Guia final no contiene check:autovideo.');
  if (!guia.includes('npm run dist:win')) throw new Error('Guia final no contiene dist:win.');
  if (!bloques.includes('Bloque 20')) throw new Error('Documento de bloques no contiene Bloque 20.');
}

function verificarCodigoFinal() {
  const server = fs.readFileSync('server.js', 'utf-8');
  const diagnostico = fs.readFileSync('app/diagnostico-fuerte-ui.js', 'utf-8');
  const errorModal = fs.readFileSync('app/error-modal.js', 'utf-8');
  if (!server.includes('/api/procesar-video')) throw new Error('server.js no contiene procesar-video.');
  if (!diagnostico.includes('/api/autovideo/diagnostico/fuerte')) throw new Error('Diagnostico fuerte UI no consume API.');
  if (!errorModal.includes('retryStageButton')) throw new Error('Modal de error no contiene reintento.');
}

try {
  verificarArchivos();
  verificarPackage();
  verificarDocumentacion();
  verificarCodigoFinal();
  console.log('OK cierre final AutoVideoJeff: version 1.0.0 lista para prueba y empaquetado.');
} catch (error) {
  console.error('ERROR cierre final AutoVideoJeff:', error.message);
  process.exit(1);
}
