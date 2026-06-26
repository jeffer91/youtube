/* Verificacion Bloque 10: diagnostico modular final. */

import { crearDiagnosticoModularAutoVideoJeff } from '../diagnostico/diagnostico-modular-autovideo.service.js';

function main() {
  const diagnostico = crearDiagnosticoModularAutoVideoJeff();
  if (!diagnostico.ok) throw new Error(diagnostico.errores.join(' | '));
  if (diagnostico.totalModulos < 14) throw new Error('Faltan modulos en el diagnostico modular.');
  if (diagnostico.modulosOk !== diagnostico.totalModulos) throw new Error('No todos los modulos estan OK.');
  if (diagnostico.uiOk !== diagnostico.totalUi) throw new Error('No todos los archivos UI estan OK.');
  console.log('OK diagnostico modular:', diagnostico.modulosOk, 'modulos y', diagnostico.uiOk, 'archivos UI');
}

try {
  main();
} catch (error) {
  console.error('ERROR diagnostico modular:', error.message);
  process.exit(1);
}
