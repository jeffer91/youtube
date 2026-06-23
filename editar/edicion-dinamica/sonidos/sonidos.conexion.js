import path from 'path';
import { asegurarCarpeta, escribirJson } from '../../../comun/archivos.js';
import { obtenerConfigSonidosEdicion } from './sonidos.config.js';
import { crearEventosSonido } from './crear-eventos-sonido.service.js';
import { generarSonidosBase } from './generar-sonidos-base.service.js';
import { validarSonidosEdicion } from './validar-sonidos-edicion.js';
import { mezclarSonidosEdicion } from './mezclar-sonidos-edicion.service.js';

function crearOmitido({ mensaje, carpetaSonidos = null, config = null }) {
  return {
    ok: true,
    omitido: true,
    mensaje,
    audioConSonidos: null,
    eventosSonido: [],
    config: config ? { activo: config.activo, modo: config.modo, volumen: config.volumen } : null,
    carpetaSonidos,
    creadoEn: new Date().toISOString()
  };
}

export async function procesarSonidosEdicion({ rutaVideoBase, visualDinamico = null, edicionDinamica = null, opciones = {} } = {}) {
  const config = obtenerConfigSonidosEdicion(opciones);
  const carpetaBase = edicionDinamica?.carpetaEdicionDinamica || null;
  const carpetaSonidos = carpetaBase ? path.join(carpetaBase, 'sonidos') : null;

  if (!config.activo) return crearOmitido({ mensaje: 'Efectos de sonido desactivados.', carpetaSonidos, config });
  if (!rutaVideoBase) return crearOmitido({ mensaje: 'No hay video base para mezclar sonidos.', carpetaSonidos, config });
  if (!visualDinamico || visualDinamico.omitido) return crearOmitido({ mensaje: 'No hay eventos visuales para convertir en sonidos.', carpetaSonidos, config });
  if (!carpetaSonidos) return crearOmitido({ mensaje: 'No hay carpeta de edición dinámica para guardar sonidos.', carpetaSonidos, config });

  asegurarCarpeta(carpetaSonidos);

  try {
    const eventos = crearEventosSonido({ visualDinamico, config, opciones });

    if (eventos.omitido || eventos.eventos.length === 0) {
      await escribirJson(path.join(carpetaSonidos, 'eventos-sonido.json'), eventos);
      return crearOmitido({ mensaje: eventos.mensaje, carpetaSonidos, config });
    }

    const sonidosBase = await generarSonidosBase({ carpetaSonidos, config });
    const validacion = validarSonidosEdicion({ rutaVideoBase, eventos: eventos.eventos, sonidosBase });

    await escribirJson(path.join(carpetaSonidos, 'eventos-sonido.json'), eventos);
    await escribirJson(path.join(carpetaSonidos, 'sonidos-base.json'), sonidosBase);
    await escribirJson(path.join(carpetaSonidos, 'validacion-sonidos.json'), validacion);

    if (!validacion.ok) return crearOmitido({ mensaje: validacion.mensaje, carpetaSonidos, config });

    const mezcla = await mezclarSonidosEdicion({ rutaVideoBase, eventos: eventos.eventos, sonidosBase, carpetaSonidos, nombreSalida: config.nombreAudioFinal });

    const resultado = {
      ok: true,
      omitido: false,
      mensaje: mezcla.mensaje,
      audioConSonidos: mezcla.audioConSonidos,
      nombreAudio: mezcla.nombreAudio,
      eventosSonido: eventos.eventos,
      eventosDescartados: eventos.descartados || 0,
      sonidosBase,
      validacion,
      mezcla,
      config: { activo: config.activo, modo: config.modo, volumen: config.volumen, separacionMinimaSegundos: config.separacionMinimaSegundos, cantidadMaximaEventos: config.cantidadMaximaEventos },
      carpetaSonidos,
      creadoEn: new Date().toISOString()
    };

    await escribirJson(path.join(carpetaSonidos, 'resultado-sonidos.json'), resultado);
    return resultado;
  } catch (error) {
    const resultado = crearOmitido({ mensaje: `No se aplicaron sonidos: ${error.message}`, carpetaSonidos, config });
    await escribirJson(path.join(carpetaSonidos, 'resultado-sonidos.json'), resultado);
    return resultado;
  }
}

export default procesarSonidosEdicion;
