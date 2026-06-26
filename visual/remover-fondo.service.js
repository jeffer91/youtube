/*
  Modulo: visual
  Funcion: crear plan para separar el fondo cuando el perfil o la escena lo requieran.
*/

export function crearPlanRemoverFondo({ perfil = 'general', sujeto = {}, opciones = {} } = {}) {
  const perfilesVisuales = ['11-contra-11', 'jeff-isekai', 'el-don-historia', 'jeff-verso'];
  const forzar = opciones.removerFondo === true;
  const automatico = opciones.removerFondo !== false && perfilesVisuales.includes(perfil);
  const confianza = Number(sujeto.confianza ?? 0.75);
  const aplicar = (forzar || automatico) && confianza >= 0.55;

  return {
    ok: true,
    aplicar,
    perfil,
    metodo: opciones.metodo || 'segmentacion_local_o_servicio',
    sujetoConfianza: confianza,
    revisarEnProduccion: aplicar,
    motivo: aplicar
      ? 'Se recomienda separar el fondo para usar recurso visual contextual.'
      : 'Se mantiene el fondo original.',
    creadoEn: new Date().toISOString()
  };
}
