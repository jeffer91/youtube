import { crearDiagnosticoAutomatico } from '../diagnostico/diagnostico-automatico.service.js';
import { verificarIntegracionFinal } from '../diagnostico/verificar-integracion-final.service.js';
import { verificarProgresoReal } from '../diagnostico/verificar-progreso-real.service.js';
import { verificarEntregaFinal } from '../entrega/entrega.conexion.js';

function resumir(nombre, resultado) {
  return {
    nombre,
    ok: Boolean(resultado?.ok),
    mensaje: resultado?.mensaje || '',
    errores: resultado?.errores || [],
    advertencias: resultado?.advertencias || []
  };
}

async function main() {
  const diagnostico = await crearDiagnosticoAutomatico({ guardarReporte: true });
  const integracion = await verificarIntegracionFinal();
  const progreso = await verificarProgresoReal();
  const entrega = verificarEntregaFinal();

  const resultados = [
    resumir('diagnostico', diagnostico),
    resumir('integracion-final', integracion),
    resumir('progreso-real', progreso),
    resumir('entrega-final', entrega)
  ];

  const ok = resultados.every((item) => item.ok);
  const errores = resultados.flatMap((item) => item.errores.map((error) => `${item.nombre}: ${error}`));
  const advertencias = resultados.flatMap((item) => item.advertencias.map((advertencia) => `${item.nombre}: ${advertencia}`));

  console.log(JSON.stringify({ ok, resultados, errores, advertencias }, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error('[verificar-todo] Error:', error);
  process.exit(1);
});
