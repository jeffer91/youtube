function esObjeto(valor) {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
}

function validarListaSiExiste(cambios, campo, errores) {
  if (cambios[campo] === undefined) return;
  if (!Array.isArray(cambios[campo])) errores.push(`${campo} debe ser una lista.`);
}

export function validarCambiosDraft(cambios = {}, config = {}) {
  const errores = [];
  const advertencias = [];

  if (!esObjeto(cambios)) {
    return { ok: false, errores: ['Los cambios del draft deben ser un objeto.'], advertencias };
  }

  validarListaSiExiste(cambios, 'cortes', errores);
  validarListaSiExiste(cambios, 'subtitulos', errores);
  validarListaSiExiste(cambios, 'textosFlotantes', errores);
  validarListaSiExiste(cambios, 'broll', errores);

  if (cambios.cortes && config.permitirEditarCortes === false) errores.push('No está permitido editar cortes en este draft.');
  if (cambios.subtitulos && config.permitirEditarSubtitulos === false) errores.push('No está permitido editar subtítulos en este draft.');
  if (cambios.textosFlotantes && config.permitirEditarTextosFlotantes === false) errores.push('No está permitido editar textos flotantes en este draft.');
  if (cambios.broll && config.permitirEditarBroll === false) errores.push('No está permitido editar B-Roll en este draft.');
  if (cambios.miniatura && config.permitirEditarMiniatura === false) errores.push('No está permitido editar miniatura en este draft.');

  const totalCambios = Object.keys(cambios).length;
  if (config.maxCambiosPorDraft && totalCambios > config.maxCambiosPorDraft) errores.push(`Demasiados cambios enviados: ${totalCambios}.`);
  if (totalCambios === 0) advertencias.push('No se recibieron cambios para aplicar.');

  return {
    ok: errores.length === 0,
    errores,
    advertencias
  };
}

export function exigirCambiosDraftValidos(cambios, config) {
  const validacion = validarCambiosDraft(cambios, config);
  if (!validacion.ok) throw new Error(`Cambios de draft inválidos: ${validacion.errores.join(' ')}`);
  return validacion;
}

export default validarCambiosDraft;
