import { spawnSync } from 'child_process';

const SCRIPTS = [
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
];

function ejecutar(script) {
  const resultado = spawnSync(process.execPath, [script], { stdio: 'inherit', shell: false });
  if (resultado.status !== 0) throw new Error(`Fallo ${script}`);
}

try {
  SCRIPTS.forEach(ejecutar);
  console.log('OK rediseño AutoVideoJeff completo:', SCRIPTS.length, 'verificaciones');
} catch (error) {
  console.error('ERROR rediseño AutoVideoJeff:', error.message);
  process.exit(1);
}
