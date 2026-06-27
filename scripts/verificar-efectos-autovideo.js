import { spawnSync } from 'child_process';

const SCRIPTS = Object.freeze([
  'scripts/verificar-catalogo-efectos.js',
  'scripts/verificar-optimizador-efectos.js',
  'scripts/verificar-planificador-efectos.js',
  'scripts/verificar-compilador-efectos.js',
  'scripts/verificar-integracion-efectos.js',
  'scripts/verificar-previsualizacion-efectos.js',
  'scripts/verificar-efectos-preview-ui.js'
]);

function ejecutar(script) {
  const resultado = spawnSync(process.execPath, [script], { stdio: 'inherit', shell: false });
  if (resultado.status !== 0) throw new Error(`Fallo ${script}`);
}

try {
  SCRIPTS.forEach(ejecutar);
  console.log('OK efectos AutoVideoJeff:', SCRIPTS.length, 'verificaciones');
} catch (error) {
  console.error('ERROR efectos AutoVideoJeff:', error.message);
  process.exit(1);
}
