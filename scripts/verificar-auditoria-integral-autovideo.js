/* Verificacion Bloque 21: auditoria integral de variables, conexiones, botones, entradas y salidas. */

import { crearAuditoriaIntegral } from '../diagnostico/auditoria-integral.service.js';

try {
  const auditoria = await crearAuditoriaIntegral({ guardarReporte: false });
  if (!auditoria.ok) {
    console.error('ERROR auditoria integral AutoVideoJeff:');
    auditoria.errores.forEach((error) => console.error('-', error));
    process.exit(1);
  }
  console.log('OK auditoria integral AutoVideoJeff:', Object.keys(auditoria.secciones).length, 'secciones revisadas');
} catch (error) {
  console.error('ERROR auditoria integral AutoVideoJeff:', error.message);
  process.exit(1);
}
