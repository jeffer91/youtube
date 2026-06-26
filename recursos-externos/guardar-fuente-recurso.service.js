/*
  Modulo: recursos-externos
  Funcion: guardar fuente, licencia y contexto del recurso.
*/

export function crearRegistroFuenteRecurso(recurso = {}, contexto = {}) {
  return {
    recursoId: recurso.id || null,
    nombre: recurso.nombre || recurso.nombreArchivo || 'Recurso',
    tipo: recurso.tipo || 'imagen',
    fuente: recurso.fuente || contexto.fuente || 'fuente_configurada',
    urlOriginal: recurso.url || contexto.url || '',
    licencia: recurso.licencia || contexto.licencia || 'pendiente_revision',
    perfil: recurso.perfil || contexto.perfil || 'general',
    tema: recurso.tema || contexto.tema || '',
    fraseRelacionada: recurso.fraseRelacionada || contexto.fraseRelacionada || contexto.frase || '',
    aprobado: recurso.aprobado === true,
    rechazado: recurso.rechazado === true,
    fecha: new Date().toISOString()
  };
}

export function aplicarFuenteARecurso(recurso = {}, fuente = {}) {
  return {
    ...recurso,
    fuente: fuente.fuente || recurso.fuente,
    licencia: fuente.licencia || recurso.licencia,
    urlOriginal: fuente.urlOriginal || recurso.urlOriginal || recurso.url,
    actualizadoEn: new Date().toISOString()
  };
}
