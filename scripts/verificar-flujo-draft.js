async function main() {
  const flujo = await import('../motor/flujo-plan-revision.js');
  const motor = await import('../motor/motor.conexion.js');
  const server = await import('../server.js');

  const validaciones = {
    flujoPlanRevision: typeof flujo.ejecutarFlujoPlanRevision === 'function',
    crearDraftVideoDesdeMotor: typeof motor.crearDraftVideoDesdeMotor === 'function',
    procesarVideoDesdeMotor: typeof motor.procesarVideoDesdeMotor === 'function',
    iniciarServidor: typeof server.iniciarServidor === 'function',
    detenerServidor: typeof server.detenerServidor === 'function'
  };

  const errores = Object.entries(validaciones)
    .filter(([, ok]) => !ok)
    .map(([nombre]) => `No está disponible ${nombre}`);

  const resultado = {
    ok: errores.length === 0,
    modulo: 'flujo-draft',
    validaciones,
    errores,
    creadoEn: new Date().toISOString()
  };

  console.log(JSON.stringify(resultado, null, 2));
  if (!resultado.ok) process.exit(1);
}

main().catch((error) => {
  console.error('[verificar-flujo-draft] Error:', error);
  process.exit(1);
});
