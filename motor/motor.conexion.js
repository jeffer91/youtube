function esCadenaValida(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function convertirBooleano(valor, valorPorDefecto = true) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }
  return valorPorDefecto;
}

function esErrorDeModuloFaltante(error, nombreArchivo) {
  const mensaje = String(error?.message || '');
  return error?.code === 'ERR_MODULE_NOT_FOUND' && mensaje.includes(nombreArchivo);
}

function validarSolicitud(solicitud) {
  if (!solicitud || typeof solicitud !== 'object') throw new Error('La solicitud del motor no es válida.');
  if (!esCadenaValida(solicitud.archivoTemporal)) throw new Error('No se recibió la ruta temporal del video.');
  if (!esCadenaValida(solicitud.nombreOriginal)) throw new Error('No se recibió el nombre original del video.');
  if (solicitud.opciones && typeof solicitud.opciones !== 'object') throw new Error('Las opciones del motor deben ser un objeto.');
}

function validarSolicitudPlan(solicitud) {
  if (!solicitud || typeof solicitud !== 'object') throw new Error('La solicitud del plan no es válida.');
  if (!solicitud.plan || typeof solicitud.plan !== 'object') throw new Error('No se recibió el plan de edición.');
  if (solicitud.opciones && typeof solicitud.opciones !== 'object') throw new Error('Las opciones del motor deben ser un objeto.');
}

function normalizarOpcionesMotor(opciones = {}) {
  return {
    ...opciones,
    plataforma: opciones.plataforma || 'tiktok',
    modo: opciones.modo || 'cuadrado-centro',
    mejorarAudio: convertirBooleano(opciones.mejorarAudio, true),
    modoAudio: opciones.modoAudio || 'limpieza-simple',
    crearTranscripcion: convertirBooleano(opciones.crearTranscripcion, true),
    agregarSubtitulos: convertirBooleano(opciones.agregarSubtitulos, true),
    agregarTextosFlotantes: convertirBooleano(opciones.agregarTextosFlotantes, true),
    edicionDinamica: convertirBooleano(opciones.edicionDinamica ?? opciones.activarEdicionDinamica ?? opciones.usarEdicionDinamica, true),
    cortarSilencios: convertirBooleano(opciones.cortarSilencios, true),
    agregarEfectosVisualesDinamicos: convertirBooleano(opciones.agregarEfectosVisualesDinamicos, true),
    agregarSonidosEdicion: convertirBooleano(opciones.agregarSonidosEdicion, true),
    requiereRevision: convertirBooleano(opciones.requiereRevision ?? opciones.draftMode, true),
    renderAutomatico: convertirBooleano(opciones.renderAutomatico, false)
  };
}

function crearRespuestaFlujoPendiente(solicitud, archivoFaltante, mensaje) {
  const opciones = normalizarOpcionesMotor(solicitud.opciones || {});
  return {
    ok: false,
    estado: 'FLUJO_PENDIENTE',
    mensaje,
    recibido: {
      nombreOriginal: solicitud.nombreOriginal || null,
      nombreTemporal: solicitud.nombreTemporal || null,
      plataforma: opciones.plataforma,
      modo: opciones.modo,
      mejorarAudio: opciones.mejorarAudio,
      modoAudio: opciones.modoAudio
    },
    pendientes: [archivoFaltante]
  };
}

export async function procesarVideoDesdeMotor(solicitud) {
  validarSolicitud(solicitud);
  const opciones = normalizarOpcionesMotor(solicitud.opciones || {});

  try {
    const moduloFlujo = await import('./flujo-principal.js');
    if (typeof moduloFlujo.ejecutarFlujoPrincipal !== 'function') throw new Error('El flujo principal existe, pero no exporta ejecutarFlujoPrincipal.');
    return await moduloFlujo.ejecutarFlujoPrincipal({
      archivoTemporal: solicitud.archivoTemporal,
      nombreOriginal: solicitud.nombreOriginal,
      nombreTemporal: solicitud.nombreTemporal || null,
      opciones,
      progreso: solicitud.progreso || null,
      jobId: solicitud.jobId || null
    });
  } catch (error) {
    if (esErrorDeModuloFaltante(error, 'flujo-principal.js')) {
      return crearRespuestaFlujoPendiente({ ...solicitud, opciones }, 'motor/flujo-principal.js', 'Base recibida correctamente, pero falta motor/flujo-principal.js para procesar el video.');
    }
    throw error;
  }
}

export async function crearDraftVideoDesdeMotor(solicitud) {
  validarSolicitud(solicitud);
  const opciones = normalizarOpcionesMotor({ ...(solicitud.opciones || {}), requiereRevision: true, renderAutomatico: false });

  try {
    const moduloFlujo = await import('./flujo-plan-revision.js');
    if (typeof moduloFlujo.ejecutarFlujoPlanRevision !== 'function') throw new Error('El flujo de plan/revisión existe, pero no exporta ejecutarFlujoPlanRevision.');
    return await moduloFlujo.ejecutarFlujoPlanRevision({
      archivoTemporal: solicitud.archivoTemporal,
      nombreOriginal: solicitud.nombreOriginal,
      nombreTemporal: solicitud.nombreTemporal || null,
      opciones,
      progreso: solicitud.progreso || null,
      jobId: solicitud.jobId || null
    });
  } catch (error) {
    if (esErrorDeModuloFaltante(error, 'flujo-plan-revision.js')) {
      return crearRespuestaFlujoPendiente({ ...solicitud, opciones }, 'motor/flujo-plan-revision.js', 'Base recibida correctamente, pero falta motor/flujo-plan-revision.js para crear el draft.');
    }
    throw error;
  }
}

export async function renderizarPlanDesdeMotor(solicitud) {
  validarSolicitudPlan(solicitud);
  const opciones = normalizarOpcionesMotor(solicitud.opciones || {});

  try {
    const moduloRender = await import('./renderizar-plan-aprobado.js');
    if (typeof moduloRender.renderizarPlanAprobado !== 'function') throw new Error('El render de plan existe, pero no exporta renderizarPlanAprobado.');
    return await moduloRender.renderizarPlanAprobado({
      plan: solicitud.plan,
      opciones,
      progreso: solicitud.progreso || null,
      jobId: solicitud.jobId || null
    });
  } catch (error) {
    if (esErrorDeModuloFaltante(error, 'renderizar-plan-aprobado.js')) {
      return crearRespuestaFlujoPendiente({ ...solicitud, opciones }, 'motor/renderizar-plan-aprobado.js', 'Plan recibido correctamente, pero falta motor/renderizar-plan-aprobado.js para renderizar.');
    }
    throw error;
  }
}

export default { procesarVideoDesdeMotor, crearDraftVideoDesdeMotor, renderizarPlanDesdeMotor };
