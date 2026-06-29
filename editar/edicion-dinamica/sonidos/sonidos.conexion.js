import fs from 'fs';
import path from 'path';
import { asegurarCarpeta, escribirJson } from '../../../comun/archivos.js';
import { reportarModulo } from '../../../progreso/progreso-modulo.js';
import { obtenerConfigSonidosEdicion } from './sonidos.config.js';
import { crearEventosSonido } from './crear-eventos-sonido.service.js';
import { generarSonidosBase } from './generar-sonidos-base.service.js';
import { validarSonidosEdicion } from './validar-sonidos-edicion.js';
import { mezclarSonidosEdicion } from './mezclar-sonidos-edicion.service.js';
import { mejorarEventosSonidoPremium } from './premium/index.js';

function crearOmitido({ mensaje, carpetaSonidos = null, config = null, premium = null, eventosPlan = 0 }) {
  return {
    ok: true,
    omitido: true,
    mensaje,
    audioConSonidos: null,
    eventosSonido: [],
    eventosSonidoBase: [],
    eventosSonidoPlan: [],
    resumenPlanSonido: { total: eventosPlan, aplicados: 0, omitidos: eventosPlan },
    sfxPremium: premium,
    config: config ? { activo: config.activo, modo: config.modo, volumen: config.volumen } : null,
    carpetaSonidos,
    creadoEn: new Date().toISOString()
  };
}

function existeArchivo(ruta) {
  return Boolean(ruta && fs.existsSync(ruta));
}

function seleccionarAudioBase({ audio = null, rutaVideoBase = null, edicionDinamica = null }) {
  const videoDinamicoActivo = Boolean(edicionDinamica?.activo && !edicionDinamica?.omitido && edicionDinamica?.videoDinamico);

  if (!videoDinamicoActivo && audio?.usarAudioMejorado && existeArchivo(audio.rutaAudioMejorado)) {
    return {
      ruta: audio.rutaAudioMejorado,
      origen: 'audio-mejorado',
      mensaje: 'Los sonidos se mezclarán sobre la voz ya mejorada.'
    };
  }

  return {
    ruta: rutaVideoBase,
    origen: videoDinamicoActivo ? 'video-dinamico-voz-procesada-en-mezcla' : 'video-base-voz-procesada-en-mezcla',
    mensaje: 'Los sonidos se mezclarán procesando la voz del video base.'
  };
}

function contarEventosPlanSonido({ edicionDinamica = null, opciones = {} } = {}) {
  return (edicionDinamica?.eventosSonidoPlan?.length || 0)
    + (edicionDinamica?.puentePlanEdicion?.eventosSonidoPlan?.length || 0)
    + (opciones?.eventosSonidoPlan?.length || 0)
    + (opciones?.instruccionesEdicionPlan || []).filter((item) => item?.tipo === 'audio-sfx').length;
}

export async function procesarSonidosEdicion({ rutaVideoBase, audio = null, visualDinamico = null, edicionDinamica = null, opciones = {}, progreso = null } = {}) {
  const config = obtenerConfigSonidosEdicion(opciones);
  const carpetaBase = edicionDinamica?.carpetaEdicionDinamica || null;
  const carpetaSonidos = carpetaBase ? path.join(carpetaBase, 'sonidos') : null;
  const totalPlanSonido = contarEventosPlanSonido({ edicionDinamica, opciones });

  await reportarModulo(progreso, {
    etapa: 'editar',
    porcentaje: 85,
    titulo: 'Preparando SFX premium',
    detalle: `Creando eventos de sonido desde plan (${totalPlanSonido}) y eventos visuales.`,
    archivo: 'editar/edicion-dinamica/sonidos/sonidos.conexion.js'
  });

  if (!config.activo) {
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 85, titulo: 'Sonidos omitidos', detalle: 'Efectos de sonido desactivados.', archivo: 'editar/edicion-dinamica/sonidos/sonidos.config.js' });
    return crearOmitido({ mensaje: 'Efectos de sonido desactivados.', carpetaSonidos, config, eventosPlan: totalPlanSonido });
  }
  if (!rutaVideoBase) {
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 85, titulo: 'Sonidos omitidos', detalle: 'No hay video base para mezclar sonidos.', archivo: 'editar/edicion-dinamica/sonidos/sonidos.conexion.js' });
    return crearOmitido({ mensaje: 'No hay video base para mezclar sonidos.', carpetaSonidos, config, eventosPlan: totalPlanSonido });
  }
  if ((!visualDinamico || visualDinamico.omitido) && totalPlanSonido === 0) {
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 85, titulo: 'Sonidos omitidos', detalle: 'No hay eventos visuales ni SFX del plan para convertir en sonidos.', archivo: 'editar/edicion-dinamica/sonidos/crear-eventos-sonido.service.js' });
    return crearOmitido({ mensaje: 'No hay eventos visuales ni SFX del plan para convertir en sonidos.', carpetaSonidos, config, eventosPlan: totalPlanSonido });
  }
  if (!carpetaSonidos) {
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 85, titulo: 'Sonidos omitidos', detalle: 'No hay carpeta de edición dinámica para guardar sonidos.', archivo: 'editar/edicion-dinamica/sonidos/sonidos.conexion.js' });
    return crearOmitido({ mensaje: 'No hay carpeta de edición dinámica para guardar sonidos.', carpetaSonidos, config, eventosPlan: totalPlanSonido });
  }

  asegurarCarpeta(carpetaSonidos);

  try {
    const eventosBase = crearEventosSonido({ visualDinamico, edicionDinamica, config, opciones });
    await reportarModulo(progreso, {
      etapa: 'editar',
      porcentaje: 86,
      titulo: 'Eventos de sonido creados',
      detalle: `${eventosBase.eventos?.length || 0} sonidos base · plan ${eventosBase.eventosPlanAplicados || 0}/${eventosBase.eventosPlan?.length || 0} · ${eventosBase.descartados || 0} descartados por seguridad.`,
      datos: { eventosSonido: eventosBase.eventos?.length || 0, eventosPlan: eventosBase.eventosPlan?.length || 0, eventosPlanAplicados: eventosBase.eventosPlanAplicados || 0, descartados: eventosBase.descartados || 0, descartadosPlan: eventosBase.descartadosPlan || {} },
      archivo: 'editar/edicion-dinamica/sonidos/crear-eventos-sonido.service.js'
    });

    if (eventosBase.omitido || eventosBase.eventos.length === 0) {
      await escribirJson(path.join(carpetaSonidos, 'eventos-sonido.json'), eventosBase);
      return crearOmitido({ mensaje: eventosBase.mensaje, carpetaSonidos, config, eventosPlan: eventosBase.eventosPlan?.length || totalPlanSonido });
    }

    const eventosPremium = mejorarEventosSonidoPremium({ eventos: eventosBase.eventos, visualDinamico, edicionDinamica, opciones, config });
    const eventos = { ...eventosBase, eventos: eventosPremium.eventos, sfxPremium: eventosPremium.premium, eventosExtraPremium: eventosPremium.eventosExtraPremium || 0, eventosDescartadosPremium: eventosPremium.eventosDescartadosPremium || 0, mensaje: eventosPremium.mensaje || eventosBase.mensaje };
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 86, titulo: 'SFX premium aplicado', detalle: `${eventos.eventos?.length || 0} eventos finales · plan ${eventos.eventosPlanAplicados || 0}/${eventos.eventosPlan?.length || 0} · paquete ${eventos.sfxPremium?.paquete?.nombre || 'general'}.`, datos: { eventosSonido: eventos.eventos?.length || 0, eventosPlan: eventos.eventosPlan?.length || 0, eventosPlanAplicados: eventos.eventosPlanAplicados || 0, eventosExtraPremium: eventos.eventosExtraPremium, calidadSfx: eventos.sfxPremium?.calidadSfx || null }, archivo: 'editar/edicion-dinamica/sonidos/premium/sfx-premium.service.js' });

    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 87, titulo: 'Generando sonidos base', detalle: 'Preparando pop, click, whoosh, hit, riser, notification, beep, intro y outro.', archivo: 'editar/edicion-dinamica/sonidos/generar-sonidos-base.service.js' });
    const sonidosBase = await generarSonidosBase({ carpetaSonidos, config });

    const validacion = validarSonidosEdicion({ rutaVideoBase, eventos: eventos.eventos, sonidosBase });
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 88, titulo: 'Validando SFX premium', detalle: validacion.ok ? 'SFX premium/listo para mezclar.' : validacion.mensaje, datos: { ok: validacion.ok, errores: validacion.errores || [] }, archivo: 'editar/edicion-dinamica/sonidos/validar-sonidos-edicion.js' });

    await escribirJson(path.join(carpetaSonidos, 'eventos-sonido-base.json'), eventosBase);
    await escribirJson(path.join(carpetaSonidos, 'eventos-sonido.json'), eventos);
    await escribirJson(path.join(carpetaSonidos, 'sfx-premium.json'), eventosPremium);
    await escribirJson(path.join(carpetaSonidos, 'sonidos-base.json'), sonidosBase);
    await escribirJson(path.join(carpetaSonidos, 'validacion-sonidos.json'), validacion);

    if (!validacion.ok) return crearOmitido({ mensaje: validacion.mensaje, carpetaSonidos, config, premium: eventos.sfxPremium, eventosPlan: eventos.eventosPlan?.length || totalPlanSonido });

    const audioBase = seleccionarAudioBase({ audio, rutaVideoBase, edicionDinamica });
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 89, titulo: 'Mezclando voz y SFX premium', detalle: `${audioBase.mensaje} Eventos finales: ${eventos.eventos.length}. Plan: ${eventos.eventosPlanAplicados || 0}/${eventos.eventosPlan?.length || 0}.`, datos: { eventosSonido: eventos.eventos.length, eventosPlan: eventos.eventosPlan?.length || 0, eventosPlanAplicados: eventos.eventosPlanAplicados || 0, origenAudioBase: audioBase.origen, paqueteSfx: eventos.sfxPremium?.paquete?.id || null }, archivo: 'editar/edicion-dinamica/sonidos/mezclar-sonidos-edicion.service.js' });
    const mezcla = await mezclarSonidosEdicion({ rutaVideoBase, rutaAudioBase: audioBase.ruta, eventos: eventos.eventos, sonidosBase, carpetaSonidos, nombreSalida: config.nombreAudioFinal });

    const resumenPlanSonido = {
      total: eventos.eventosPlan?.length || 0,
      aplicados: eventos.eventosPlanAplicados || 0,
      omitidos: Math.max(0, (eventos.eventosPlan?.length || 0) - (eventos.eventosPlanAplicados || 0)),
      descartados: eventos.descartadosPlan || {}
    };

    const resultado = {
      ok: true,
      omitido: false,
      mensaje: `${mezcla.mensaje} SFX desde plan: ${resumenPlanSonido.aplicados}/${resumenPlanSonido.total}.`,
      audioConSonidos: mezcla.audioConSonidos,
      nombreAudio: mezcla.nombreAudio,
      audioBase,
      eventosSonido: eventos.eventos,
      eventosSonidoBase: eventosBase.eventos,
      eventosSonidoPlan: eventos.eventosPlan || [],
      resumenPlanSonido,
      eventosDescartados: eventosBase.descartados || 0,
      eventosExtraPremium: eventos.eventosExtraPremium || 0,
      eventosDescartadosPremium: eventos.eventosDescartadosPremium || 0,
      sfxPremium: eventos.sfxPremium || null,
      sonidosBase,
      validacion,
      mezcla,
      config: { activo: config.activo, modo: config.modo, volumen: config.volumen, separacionMinimaSegundos: config.separacionMinimaSegundos, cantidadMaximaEventos: config.cantidadMaximaEventos },
      carpetaSonidos,
      creadoEn: new Date().toISOString()
    };

    await escribirJson(path.join(carpetaSonidos, 'resultado-sonidos.json'), resultado);
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 90, titulo: 'Audio final con SFX premium', detalle: `${eventos.eventos.length} SFX mezclados con voz al frente · plan ${resumenPlanSonido.aplicados}/${resumenPlanSonido.total}.`, datos: { eventosSonido: eventos.eventos.length, resumenPlanSonido, audioConSonidos: mezcla.audioConSonidos, origenAudioBase: audioBase.origen, calidadSfx: eventos.sfxPremium?.calidadSfx || null }, archivo: 'editar/edicion-dinamica/sonidos/sonidos.conexion.js' });

    return resultado;
  } catch (error) {
    const resultado = crearOmitido({ mensaje: `No se aplicaron sonidos: ${error.message}`, carpetaSonidos, config, eventosPlan: totalPlanSonido });
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 88, titulo: 'SFX premium en modo seguro', detalle: resultado.mensaje, archivo: 'editar/edicion-dinamica/sonidos/sonidos.conexion.js' });
    await escribirJson(path.join(carpetaSonidos, 'resultado-sonidos.json'), resultado);
    return resultado;
  }
}

export default procesarSonidosEdicion;
