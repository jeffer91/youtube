import { renderizarPlanAprobado } from '../motor/renderizar-plan-aprobado.js';
import { renderizarPlanDesdeMotor } from '../motor/motor.conexion.js';
import { aprobarPlanEdicion } from '../plan-edicion/aprobar-plan-edicion.js';
import { aplicarDraftAPlan } from '../revision/aplicar-draft-a-plan.js';

async function main() {
  const validaciones = {
    renderizarPlanAprobado: typeof renderizarPlanAprobado === 'function',
    renderizarPlanDesdeMotor: typeof renderizarPlanDesdeMotor === 'function',
    aprobarPlanEdicion: typeof aprobarPlanEdicion === 'function',
    aplicarDraftAPlan: typeof aplicarDraftAPlan === 'function'
  };

  const errores = Object.entries(validaciones)
    .filter(([, ok]) => !ok)
    .map(([nombre]) => `No está disponible ${nombre}`);

  const resultado = {
    ok: errores.length === 0,
    modulo: 'render-plan',
    validaciones,
    errores,
    creadoEn: new Date().toISOString()
  };

  console.log(JSON.stringify(resultado, null, 2));
  if (!resultado.ok) process.exit(1);
}

main().catch((error) => {
  console.error('[verificar-render-plan] Error:', error);
  process.exit(1);
});
