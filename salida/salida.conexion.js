import fs from 'fs';
import { reportarModulo } from '../progreso/progreso-modulo.js';
import { exportarVideoSimple } from './exportar-simple/exportar.service.js';

function convertirBooleano(valor, respaldo = true) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo', 'activado'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(limpio)) return false;
  }
  return respaldo;
}

function debeExportar(opciones = {}) {
  return convertirBooleano(opciones.exportacion ?? opciones.opcionesProcesamiento?.exportacion, true);
}

function crearSalidaOmitida({ entrada, edicion, opciones = {} }) {
  return {
    ok: true,
    etapa: 'salida',
    tipo: 'exportacion-omitida',
    omitido: true,
    exportado: false,
    mensaje: 'Exportación omitida por selección del usuario.',
    plataforma: edicion?.plataforma || opciones.plataforma || entrada?.proyecto?.plataforma || 'tiktok',
    modo: edicion?.modo || opciones.modo || entrada?.proyecto?.modo || 'cuadrado-centro',
    rutaExportada: null,
    rutaRelativa: null,
    nombreExportado: null,
    urlPublica: null,
    audio: {
      tipo: 'sin-exportacion',
      omitido: true,
      mensaje: 'No se generó audio final porque la exportación fue omitida.'
    },
    edicion: {
      tipo: edicion?.tipo || null,
      modo: edicion?.modo || null,
      preparada: Boolean(edicion)
    },
    opciones: { ...opciones, exportacion: false },
    creadoEn: new Date().toISOString()
  };
}

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

export async function prepararSalida({ entrada, entendimiento, audio = null, edicion, opciones = {}, progreso = null }) {
  if (!debeExportar(opciones)) {
    await reportarModulo(progreso, {
      etapa: 'salida',
      porcentaje: 91,
      titulo: 'Exportación omitida',
      detalle: 'No se generará MP4 final porque Exportar video final está desmarcado.',
      archivo: 'salida/salida.conexion.js'
    });

    return crearSalidaOmitida({ entrada, edicion, opciones });
  }

  await reportarModulo(progreso, {
    etapa: 'salida',
    porcentaje: 90,
    titulo: 'Validando salida',
    detalle: 'Revisando video, filtro, audio y nombre final antes de exportar.',
    archivo: 'salida/salida.conexion.js'
  });

  validarParaSalida({ entrada, edicion, audio });

  await reportarModulo(progreso, {
    etapa: 'salida',
    porcentaje: 91,
    titulo: 'Salida validada',
    detalle: `Archivo final: ${edicion.salida?.nombreExportado || 'video.mp4'}.`,
    datos: { nombreExportado: edicion.salida?.nombreExportado || null },
    archivo: 'salida/salida.conexion.js'
  });

  return await exportarVideoSimple({ entrada, entendimiento, audio, edicion, opciones, progreso });
}

export default { prepararSalida };
