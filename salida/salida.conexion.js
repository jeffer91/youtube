import fs from 'fs';
import { reportarModulo } from '../progreso/progreso-modulo.js';
import { exportarVideoSimple } from './exportar-simple/exportar.service.js';

function validarParaSalida({ entrada, edicion, audio }) {
  if (!entrada?.video?.rutaOriginal) throw new Error('No se puede exportar porque falta el video original.');
  if (!fs.existsSync(entrada.video.rutaOriginal)) throw new Error(`No se puede exportar porque no existe el video original: ${entrada.video.rutaOriginal}`);
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede exportar porque falta la carpeta del proyecto.');
  if (!edicion || typeof edicion !== 'object') throw new Error('No se puede exportar porque falta el plan de edición.');
  if (edicion.ok !== true) throw new Error('No se puede exportar porque la edición no terminó correctamente.');
  if (!edicion.render?.filtroVideo) throw new Error('No se puede exportar porque falta el filtro de video.');
  if (!edicion.salida?.nombreExportado) throw new Error('No se puede exportar porque falta el nombre del archivo final.');
  if (audio && typeof audio !== 'object') throw new Error('No se puede exportar porque el resultado de audio no es válido.');
}

function seleccionarEdicionDinamicaParaSalida(edicionDinamica, edicion) {
  return edicion?.edicionDinamicaUsada || edicionDinamica || null;
}

export async function prepararSalida({ entrada, entendimiento, audio = null, transcripcion = null, edicionDinamica = null, edicion, opciones = {}, progreso = null }) {
  await reportarModulo(progreso, { etapa: 'salida', porcentaje: 90, titulo: 'Validando salida', detalle: 'Revisando video, filtro, audio y nombre final antes de exportar.', archivo: 'salida/salida.conexion.js' });
  validarParaSalida({ entrada, edicion, audio });

  const edicionDinamicaFinal = seleccionarEdicionDinamicaParaSalida(edicionDinamica, edicion);

  await reportarModulo(progreso, {
    etapa: 'salida',
    porcentaje: 91,
    titulo: 'Salida validada',
    detalle: `Archivo final: ${edicion.salida?.nombreExportado || 'video.mp4'}.`,
    datos: {
      nombreExportado: edicion.salida?.nombreExportado || null,
      videoDinamico: Boolean(edicionDinamicaFinal?.videoDinamico),
      efectosPlan: edicionDinamicaFinal?.eventosVisualesPlan?.length || 0,
      sonidosPlan: edicionDinamicaFinal?.eventosSonidoPlan?.length || 0
    },
    archivo: 'salida/salida.conexion.js'
  });

  return await exportarVideoSimple({ entrada, entendimiento, audio, transcripcion, edicionDinamica: edicionDinamicaFinal, edicion, opciones, progreso });
}
