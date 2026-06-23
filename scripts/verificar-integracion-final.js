import { verificarIntegracionFinal } from '../diagnostico/verificar-integracion-final.service.js';

async function main() {
  const resultado = await verificarIntegracionFinal();
  console.log(JSON.stringify({ ok: resultado.ok, mensaje: resultado.mensaje, archivosRevisados: resultado.archivosRevisados, errores: resultado.errores, advertencias: resultado.advertencias }, null, 2));
  if (!resultado.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error('[integracion-final] Error:', error);
  process.exitCode = 1;
});
