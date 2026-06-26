import { crearDiagnosticoAutomatico } from '../diagnostico/diagnostico-automatico.service.js';
import { verificarIntegracionFinal } from '../diagnostico/verificar-integracion-final.service.js';
import { verificarProgresoReal } from '../diagnostico/verificar-progreso-real.service.js';
import { verificarEntregaFinal } from '../entrega/entrega.conexion.js';
import { execFileSync } from 'child_process';

function resumir(nombre, resultado) {
  return {
    nombre,
    ok: Boolean(resultado?.ok),
    mensaje: resultado?.mensaje || '',
    errores: resultado?.errores || [],
    advertencias: resultado?.advertencias || []
  };
}

function verificarUiConexiones() {
  try {
    const salida = execFileSync(process.execPath, ['scripts/verificar-ui-conexiones.js'], { encoding: 'utf8' });
    const datos = JSON.parse(salida);
    return { ok: datos.ok, mensaje: datos.mensaje, errores: datos.errores || [], advertencias: [] };
  } catch (error) {
    return { ok: false, mensaje: 'Error al verificar UI y conexiones.', errores: [error.message], advertencias: [] };
  }
}

async function main() {
  const ui = verificarUiConexiones();
  const diagnostico = await crearDiagnosticoAutomatico({ guardarReporte: true });
  const integracion = await verificarIntegracionFinal();
  const progreso = await verificarProgresoReal();
  const entrega = verificarEntregaFinal();

  const resultados = [
    resumir('ui-conexiones', ui),
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
