/*
  Modulo: biblioteca
  Funcion: validar que un recurso tenga fuente y licencia registradas.
*/

const LICENCIAS_SEGURAS = ['propio', 'libre', 'creative_commons', 'public_domain', 'stock_autorizado'];

export function validarLicenciaRecurso(recurso = {}) {
  const errores = [];
  const advertencias = [];

  if (!recurso.fuente) errores.push('El recurso no tiene fuente registrada.');
  if (!recurso.licencia || recurso.licencia === 'pendiente_revision') advertencias.push('La licencia debe revisarse antes de exportar.');
  if (recurso.licencia && !LICENCIAS_SEGURAS.includes(recurso.licencia)) advertencias.push(`Licencia no confirmada: ${recurso.licencia}`);

  return {
    ok: errores.length === 0,
    seguroParaExportar: errores.length === 0 && advertencias.length === 0,
    errores,
    advertencias,
    recursoId: recurso.id || null
  };
}

export function marcarLicenciaRevisada(recurso = {}, licencia = 'libre') {
  return {
    ...recurso,
    licencia,
    estado: recurso.estado === 'rechazado' ? recurso.estado : 'aprobado',
    aprobado: recurso.estado !== 'rechazado',
    actualizadoEn: new Date().toISOString()
  };
}
