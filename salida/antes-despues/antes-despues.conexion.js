import path from 'path';
import { asegurarCarpeta, copiarArchivoSeguro, escribirJson, normalizarNombreArchivo, obtenerRutaRaiz } from '../../comun/archivos.js';

function crearUrlExport(nombreArchivo) {
  if (!nombreArchivo) return null;
  return `/exports/${encodeURIComponent(nombreArchivo)}`;
}

function crearUrlFinal(salida) {
  if (salida?.urlPublica) return salida.urlPublica;
  if (salida?.nombreExportado) return crearUrlExport(salida.nombreExportado);
  return null;
}

function crearCambio(etiqueta, activo, detalle) {
  return { etiqueta, activo: Boolean(activo), detalle };
}

function crearCambios({ audio, transcripcion, edicionDinamica, edicion }) {
  const tieneTextos = Boolean((transcripcion && !transcripcion.omitido) || edicion?.transcripcion?.capasAplicadas);
  const tieneDinamica = Boolean((edicionDinamica?.activo && !edicionDinamica?.omitido) || edicion?.edicionDinamica?.activa);

  return [
    crearCambio('Formato final', true, `Se generó un video en modo ${edicion?.modo || 'tiktok'}.`),
    crearCambio('Audio', audio && !audio.omitido, audio?.mensaje || 'Se mantuvo el audio original.'),
    crearCambio('Subtítulos y textos', tieneTextos, transcripcion?.mensaje || edicion?.transcripcion?.mensaje || 'No se aplicaron textos automáticos.'),
    crearCambio('Cortes dinámicos', tieneDinamica, edicionDinamica?.diagnostico?.mensaje || edicionDinamica?.motivo || edicion?.edicionDinamica?.mensaje || 'No se aplicaron cortes dinámicos.'),
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

async function prepararOriginalParaVista(entrada) {
  const raiz = obtenerRutaRaiz();
  const carpetaExportados = path.join(raiz, 'datos', 'videos-exportados');
  asegurarCarpeta(carpetaExportados);

  const nombreSeguro = normalizarNombreArchivo(entrada.video.nombreSeguro || entrada.video.nombreOriginal || path.basename(entrada.video.rutaOriginal));
  const extension = path.extname(nombreSeguro) || '.mp4';
  const base = path.basename(nombreSeguro, extension);
  const nombreOriginalVista = `${base}-ANTES${extension}`;
  const rutaOriginalVista = path.join(carpetaExportados, nombreOriginalVista);

  await copiarArchivoSeguro(entrada.video.rutaOriginal, rutaOriginalVista);

  return {
    nombre: nombreOriginalVista,
    ruta: rutaOriginalVista,
    urlPublica: crearUrlExport(nombreOriginalVista)
  };
}

export async function crearAntesDespues({ entrada, salida, audio = null, transcripcion = null, edicionDinamica = null, edicion = null, opciones = {} } = {}) {
  validarBase({ entrada, salida });

  const carpetaAntesDespues = path.join(entrada.rutas.carpetaProyecto, 'antes-despues');
  asegurarCarpeta(carpetaAntesDespues);

  const originalVista = await prepararOriginalParaVista(entrada);
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
      copiaVista: originalVista
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
