import path from 'path';
import { asegurarCarpeta, escribirJson } from '../../comun/archivos.js';

function crearUrlOriginal(rutaOriginal) {
  if (!rutaOriginal) return null;
  return `/originales/${encodeURIComponent(path.basename(rutaOriginal))}`;
}

function crearUrlFinal(salida) {
  if (salida?.urlPublica) return salida.urlPublica;
  if (salida?.nombreExportado) return `/exports/${encodeURIComponent(salida.nombreExportado)}`;
  return null;
}

function crearCambio(etiqueta, activo, detalle) {
  return { etiqueta, activo: Boolean(activo), detalle };
}

function crearCambios({ audio, transcripcion, edicionDinamica, edicion }) {
  return [
    crearCambio('Formato final', true, `Se generó un video en modo ${edicion?.modo || 'tiktok'}.`),
    crearCambio('Audio', audio && !audio.omitido, audio?.mensaje || 'Se mantuvo el audio original.'),
    crearCambio('Subtítulos y textos', transcripcion && !transcripcion.omitido, transcripcion?.mensaje || 'No se aplicaron textos automáticos.'),
    crearCambio('Cortes dinámicos', edicionDinamica?.activo && !edicionDinamica?.omitido, edicionDinamica?.diagnostico?.mensaje || edicionDinamica?.motivo || 'No se aplicaron cortes dinámicos.'),
    crearCambio('Visuales dinámicos', edicion?.visualDinamico && !edicion.visualDinamico.omitido, edicion?.visualDinamico?.mensaje || 'No se aplicaron visuales dinámicos.'),
    crearCambio('Sonidos de edición', edicion?.sonidos && !edicion.sonidos.omitido, edicion?.sonidos?.mensaje || 'No se aplicaron sonidos de edición.')
  ];
}

function crearResumenCambios(cambios) {
  const activos = cambios.filter((item) => item.activo).map((item) => item.etiqueta);
  if (activos.length === 0) return 'Se generó una versión final sin cambios opcionales aplicados.';
  return `Cambios aplicados: ${activos.join(', ')}.`;
}

function validarBase({ entrada, salida }) {
  if (!entrada?.video?.rutaOriginal) throw new Error('No se puede crear antes/después porque falta el video original.');
  if (!salida?.rutaExportada && !salida?.urlPublica) throw new Error('No se puede crear antes/después porque falta el video exportado.');
  if (!entrada?.rutas?.carpetaProyecto) throw new Error('No se puede crear antes/después porque falta la carpeta del proyecto.');
}

export async function crearAntesDespues({ entrada, salida, audio = null, transcripcion = null, edicionDinamica = null, edicion = null, opciones = {} } = {}) {
  validarBase({ entrada, salida });

  const carpetaAntesDespues = path.join(entrada.rutas.carpetaProyecto, 'antes-despues');
  asegurarCarpeta(carpetaAntesDespues);

  const cambios = crearCambios({ audio, transcripcion, edicionDinamica, edicion });
  const resumen = crearResumenCambios(cambios);
  const nombreReporte = 'antes-despues.json';
  const rutaReporte = path.join(carpetaAntesDespues, nombreReporte);

  const resultado = {
    ok: true,
    etapa: 'antes-despues',
    mensaje: 'Comparación antes/después creada correctamente.',
    resumen,
    original: {
      etiqueta: 'Antes',
      nombre: entrada.video.nombreOriginal || entrada.video.nombreSeguro || path.basename(entrada.video.rutaOriginal),
      ruta: entrada.video.rutaOriginal,
      urlPublica: crearUrlOriginal(entrada.video.rutaOriginal)
    },
    final: {
      etiqueta: 'Después',
      nombre: salida.nombreExportado || path.basename(salida.rutaExportada || 'video-final.mp4'),
      ruta: salida.rutaExportada || null,
      urlPublica: crearUrlFinal(salida)
    },
    cambios,
    opciones: {
      plataforma: opciones?.plataforma || edicion?.plataforma || null,
      modo: opciones?.modo || edicion?.modo || null
    },
    reporte: {
      nombre: nombreReporte,
      ruta: rutaReporte
    },
    creadoEn: new Date().toISOString()
  };

  await escribirJson(rutaReporte, resultado);
  return resultado;
}

export default crearAntesDespues;
