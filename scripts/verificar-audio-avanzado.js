/* Verificacion Bloque 2: audio avanzado. */

import { crearPlanAudio, diagnosticarPlanAudio, detectarRuidoInicial } from '../audio/audio.conexion.js';

function main() {
  const ruido = detectarRuidoInicial({ analisisAudio: { picoInicialDb: -10 } });
  const plan = crearPlanAudio({ analisisAudio: { picoInicialDb: -10 } }, { permitirCorteInicio: true });
  const diagnostico = diagnosticarPlanAudio(plan);

  if (!ruido.detectado) throw new Error('No se detecto ruido inicial de prueba.');
  if (!plan.limpieza?.acciones?.length) throw new Error('No se crearon acciones de limpieza.');
  if (!diagnostico.ok) throw new Error(diagnostico.errores.join(' | '));

  console.log('OK audio avanzado:', plan.limpieza.acciones.length, 'acciones');
}

try {
  main();
} catch (error) {
  console.error('ERROR audio avanzado:', error.message);
  process.exit(1);
}
