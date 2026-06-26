/*
  Modulo: audio
  Funcion: diagnosticar el plan de audio antes de integrarlo al motor.
*/

export function diagnosticarPlanAudio(plan = {}) {
  const errores = [];
  const advertencias = [];

  if (!plan || typeof plan !== 'object') errores.push('No existe plan de audio.');
  if (plan.ok !== true) errores.push('El plan de audio no esta marcado como correcto.');
  if (!plan.limpieza) advertencias.push('El plan de audio no tiene bloque de limpieza.');
  if (plan.musica?.volumenSugerido > 0.25) advertencias.push('La musica sugerida debe revisarse.');

  return {
    ok: errores.length === 0,
    bloqueante: errores.length > 0,
    errores,
    advertencias,
    resumen: {
      requiereRevision: Boolean(plan.requiereRevision),
      accionesLimpieza: plan.limpieza?.acciones?.length || 0,
      musica: plan.musica?.aplicar === true,
      efectosSonido: plan.efectosSonido?.aplicar === true
    },
    creadoEn: new Date().toISOString()
  };
}
