import { spawnSync } from 'child_process';

const SCRIPTS = [
  'scripts/verificar-proyectos.js',
  'scripts/verificar-perfiles.js',
  'scripts/verificar-exportacion-plataformas.js',
  'scripts/verificar-bloque-2-autovideo.js',
  'scripts/verificar-bloque-3-autovideo.js',
  'scripts/verificar-bloque-4-autovideo.js',
  'scripts/verificar-bloque-5-autovideo.js',
  'scripts/verificar-bloque-6-autovideo.js',
  'scripts/verificar-bloque-7-autovideo.js',
  'scripts/verificar-bloque-8-autovideo.js',
  'scripts/verificar-bloque-9-autovideo.js',
  'scripts/verificar-bloque-10-autovideo.js',
  'scripts/verificar-bloque-11-autovideo.js',
  'scripts/verificar-bloque-12-autovideo.js',
  'scripts/verificar-bloque-13-autovideo.js',
  'scripts/verificar-bloque-14-autovideo.js',
  'scripts/verificar-bloque-15-autovideo.js',
  'scripts/verificar-bloque-16-autovideo.js',
  'scripts/verificar-bloque-17-autovideo.js',
  'scripts/verificar-bloque-18-autovideo.js',
  'scripts/verificar-diagnostico-modular.js',
  'scripts/verificar-estructura-modular.js',
  'scripts/verificar-integracion-modular-final.js'
];

function ejecutar(script) {
  const resultado = spawnSync(process.execPath, [script], { stdio: 'inherit', shell: false });
  if (resultado.status !== 0) throw new Error(`Fallo ${script}`);
}

try {
  SCRIPTS.forEach(ejecutar);
  console.log('OK todos los bloques AutoVideoJeff:', SCRIPTS.length, 'verificaciones');
} catch (error) {
  console.error('ERROR bloques AutoVideoJeff:', error.message);
  process.exit(1);
}
