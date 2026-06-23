import { verificarProgresoReal } from '../diagnostico/verificar-progreso-real.service.js';

async function main() {
  const resultado = await verificarProgresoReal();
  console.log(JSON.stringify({ ok: resultado.ok, mensaje: resultado.mensaje, resumen: resultado.resumen, errores: resultado.errores, advertencias: resultado.advertencias }, null, 2));
  process.exit(resultado.ok ? 0 : 1);
}

main().catch((error) => {
  console.error('[progreso-real] Error:', error);
  process.exit(1);
});
