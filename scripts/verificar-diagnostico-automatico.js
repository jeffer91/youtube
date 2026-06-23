import { crearDiagnosticoAutomatico, diagnosticoEsBloqueante } from '../diagnostico/diagnostico-automatico.service.js';

async function main() {
  const diagnostico = await crearDiagnosticoAutomatico({ guardarReporte: true });
  console.log(JSON.stringify({ ok: diagnostico.ok, bloqueante: diagnostico.bloqueante, resumen: diagnostico.resumen, errores: diagnostico.errores, advertencias: diagnostico.advertencias, rutaReporte: diagnostico.rutaReporte || null }, null, 2));

  if (diagnosticoEsBloqueante(diagnostico)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[diagnostico-automatico] Error:', error);
  process.exitCode = 1;
});
