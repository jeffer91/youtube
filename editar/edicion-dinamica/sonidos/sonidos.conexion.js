import fs from 'fs';
import path from 'path';
import { asegurarCarpeta, escribirJson } from '../../../comun/archivos.js';
import { reportarModulo } from '../../../progreso/progreso-modulo.js';
import { obtenerConfigSonidosEdicion } from './sonidos.config.js';
import { crearEventosSonido } from './crear-eventos-sonido.service.js';
import { generarSonidosBase } from './generar-sonidos-base.service.js';
import { validarSonidosEdicion } from './validar-sonidos-edicion.js';
import { mezclarSonidosEdicion } from './mezclar-sonidos-edicion.service.js';

function crearOmitido({ mensaje, carpetaSonidos = null, config = null }) {
  return { ok: true, omitido: true, mensaje, audioConSonidos: null, eventosSonido: [], config: config ? { activo: config.activo, modo: config.modo, volumen: config.volumen } : null, carpetaSonidos, creadoEn: new Date().toISOString() };
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

export async function procesarSonidosEdicion({ rutaVideoBase, audio = null, visualDinamico = null, edicionDinamica = null, opciones = {}, progreso = null } = {}) {
  const config = obtenerConfigSonidosEdicion(opciones);
  const carpetaBase = edicionDinamica?.carpetaEdicionDinamica || null;
  const carpetaSonidos = carpetaBase ? path.join(carpetaBase, 'sonidos') : null;

  await reportarModulo(progreso, { etapa: 'editar', porcentaje: 85, titulo: 'Preparando sonidos', detalle: 'Creando eventos de sonido desde los eventos visuales.', archivo: 'editar/edicion-dinamica/sonidos/sonidos.conexion.js' });

  if (!config.activo) {
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 85, titulo: 'Sonidos omitidos', detalle: 'Efectos de sonido desactivados.', archivo: 'editar/edicion-dinamica/sonidos/sonidos.config.js' });
    return crearOmitido({ mensaje: 'Efectos de sonido desactivados.', carpetaSonidos, config });
  }
  if (!rutaVideoBase) {
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 85, titulo: 'Sonidos omitidos', detalle: 'No hay video base para mezclar sonidos.', archivo: 'editar/edicion-dinamica/sonidos/sonidos.conexion.js' });
    return crearOmitido({ mensaje: 'No hay video base para mezclar sonidos.', carpetaSonidos, config });
  }
  if (!visualDinamico || visualDinamico.omitido) {
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 85, titulo: 'Sonidos omitidos', detalle: 'No hay eventos visuales para convertir en sonidos.', archivo: 'editar/edicion-dinamica/sonidos/crear-eventos-sonido.service.js' });
    return crearOmitido({ mensaje: 'No hay eventos visuales para convertir en sonidos.', carpetaSonidos, config });
  }
  if (!carpetaSonidos) {
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 85, titulo: 'Sonidos omitidos', detalle: 'No hay carpeta de edición dinámica para guardar sonidos.', archivo: 'editar/edicion-dinamica/sonidos/sonidos.conexion.js' });
    return crearOmitido({ mensaje: 'No hay carpeta de edición dinámica para guardar sonidos.', carpetaSonidos, config });
  }

  asegurarCarpeta(carpetaSonidos);

  try {
    const eventos = crearEventosSonido({ visualDinamico, config, opciones });
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 86, titulo: 'Eventos de sonido creados', detalle: `${eventos.eventos?.length || 0} sonidos preparados · ${eventos.descartados || 0} descartados por seguridad.`, datos: { eventosSonido: eventos.eventos?.length || 0, descartados: eventos.descartados || 0 }, archivo: 'editar/edicion-dinamica/sonidos/crear-eventos-sonido.service.js' });

    if (eventos.omitido || eventos.eventos.length === 0) {
      await escribirJson(path.join(carpetaSonidos, 'eventos-sonido.json'), eventos);
      return crearOmitido({ mensaje: eventos.mensaje, carpetaSonidos, config });
    }

    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 87, titulo: 'Generando sonidos base', detalle: 'Preparando pop, click, whoosh, hit, intro y outro.', archivo: 'editar/edicion-dinamica/sonidos/generar-sonidos-base.service.js' });
    const sonidosBase = await generarSonidosBase({ carpetaSonidos, config });

    const validacion = validarSonidosEdicion({ rutaVideoBase, eventos: eventos.eventos, sonidosBase });
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 88, titulo: 'Validando sonidos', detalle: validacion.ok ? 'Sonidos listos para mezclar.' : validacion.mensaje, datos: { ok: validacion.ok, errores: validacion.errores || [] }, archivo: 'editar/edicion-dinamica/sonidos/validar-sonidos-edicion.js' });

    await escribirJson(path.join(carpetaSonidos, 'eventos-sonido.json'), eventos);
    await escribirJson(path.join(carpetaSonidos, 'sonidos-base.json'), sonidosBase);
    await escribirJson(path.join(carpetaSonidos, 'validacion-sonidos.json'), validacion);

    if (!validacion.ok) return crearOmitido({ mensaje: validacion.mensaje, carpetaSonidos, config });

    const audioBase = seleccionarAudioBase({ audio, rutaVideoBase, edicionDinamica });
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 89, titulo: 'Mezclando voz y sonidos', detalle: `${audioBase.mensaje} Eventos: ${eventos.eventos.length}.`, datos: { eventosSonido: eventos.eventos.length, origenAudioBase: audioBase.origen }, archivo: 'editar/edicion-dinamica/sonidos/mezclar-sonidos-edicion.service.js' });
    const mezcla = await mezclarSonidosEdicion({ rutaVideoBase, rutaAudioBase: audioBase.ruta, eventos: eventos.eventos, sonidosBase, carpetaSonidos, nombreSalida: config.nombreAudioFinal });

    const resultado = { ok: true, omitido: false, mensaje: mezcla.mensaje, audioConSonidos: mezcla.audioConSonidos, nombreAudio: mezcla.nombreAudio, audioBase, eventosSonido: eventos.eventos, eventosDescartados: eventos.descartados || 0, sonidosBase, validacion, mezcla, config: { activo: config.activo, modo: config.modo, volumen: config.volumen, separacionMinimaSegundos: config.separacionMinimaSegundos, cantidadMaximaEventos: config.cantidadMaximaEventos }, carpetaSonidos, creadoEn: new Date().toISOString() };

    await escribirJson(path.join(carpetaSonidos, 'resultado-sonidos.json'), resultado);
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 90, titulo: 'Audio final preparado', detalle: `${eventos.eventos.length} sonidos mezclados con voz al frente.`, datos: { eventosSonido: eventos.eventos.length, audioConSonidos: mezcla.audioConSonidos, origenAudioBase: audioBase.origen }, archivo: 'editar/edicion-dinamica/sonidos/sonidos.conexion.js' });

    return resultado;
  } catch (error) {
    const resultado = crearOmitido({ mensaje: `No se aplicaron sonidos: ${error.message}`, carpetaSonidos, config });
    await reportarModulo(progreso, { etapa: 'editar', porcentaje: 88, titulo: 'Sonidos en modo seguro', detalle: resultado.mensaje, archivo: 'editar/edicion-dinamica/sonidos/sonidos.conexion.js' });
    await escribirJson(path.join(carpetaSonidos, 'resultado-sonidos.json'), resultado);
    return resultado;
  }
}

export default procesarSonidosEdicion;
