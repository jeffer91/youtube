/*
  Modulo: visual
  Funcion: preparar fondo contextual detras del sujeto cuando se remueva o reduzca el fondo original.
*/

export function crearPlanFondo({ perfil = 'general', recurso = null, removerFondo = null } = {}) {
  const tipoFondo = recurso?.tipo || 'imagen_contextual';
  const usarFondo = Boolean(removerFondo?.aplicar || recurso);

  return {
    ok: true,
    aplicar: usarFondo,
    perfil,
    tipo: tipoFondo,
    recurso: recurso
      ? {
          id: recurso.id || null,
          nombre: recurso.nombre || 'Recurso visual',
          ruta: recurso.ruta || recurso.url || '',
          fuente: recurso.fuente || 'biblioteca'
        }
      : null,
    estilo: {
      desenfoque: perfil === 'institucional' ? 4 : 8,
      oscurecer: perfil === 'institucional' ? 0.08 : 0.18,
      movimiento: perfil === 'institucional' ? 'suave' : 'lento'
    },
    requiereRevision: usarFondo,
    creadoEn: new Date().toISOString()
  };
}
