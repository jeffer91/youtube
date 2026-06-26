/*
  Modulo: recursos-externos
  Funcion: validar recursos externos antes de guardarlos o enviarlos a produccion.
*/

const TIPOS_VALIDOS = ['imagen', 'video', 'audio'];

export function validarRecursoExterno(recurso = {}) {
  const errores = [];
  const advertencias = [];

  if (!TIPOS_VALIDOS.includes(recurso.tipo)) errores.push(`Tipo externo no soportado: ${recurso.tipo}`);
  if (!recurso.url && !recurso.ruta) errores.push('El recurso externo necesita url o ruta.');
  if (!recurso.fuente) errores.push('El recurso externo necesita fuente.');
  if (!recurso.nombre && !recurso.nombreArchivo) advertencias.push('Conviene poner un nombre entendible al recurso.');
  if (!recurso.licencia || recurso.licencia === 'pendiente_revision') advertencias.push('Licencia pendiente de revision.');

  return {
    ok: errores.length === 0,
    requiereRevision: true,
    seguroParaUsoAutomatico: errores.length === 0 && advertencias.length === 0,
    errores,
    advertencias,
    recurso
  };
}
