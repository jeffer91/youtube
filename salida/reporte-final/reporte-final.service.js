/*
  Nueva etapa estructural - Bloque 6
  Función: crear reporte final con efectos, imágenes, animaciones, textos, audio y diagnóstico del resultado.
*/

import path from 'path';
import { escribirJson } from '../../comun/archivos.js';

function lista(valor) { return Array.isArray(valor) ? valor : []; }
function texto(valor, respaldo = '') { const limpio = String(valor || '').replace(/\s+/g, ' ').trim(); return limpio || respaldo; }

function obtenerMotorEfectos(edicion = {}) {
  return edicion?.visualDinamico?.motorEfectos || edicion?.motorEfectos || edicion?.edicionDinamica?.motorEfectos || null;
}

function extraerEfectosUsados(edicion = {}) {
  const motor = obtenerMotorEfectos(edicion);
  const efectos = lista(motor?.plan?.efectos || motor?.plan?.items || motor?.detalle?.efectos);
  const compilado = motor?.compilado || {};
  return efectos.map((efecto, indice) => ({
    id: efecto.id || efecto.efectoId || `efecto-${indice + 1}`,
    nombre: efecto.nombre || efecto.efectoId || efecto.id || `Efecto ${indice + 1}`,
    categoria: efecto.categoria || efecto.tipo || 'visual',
    inicio: efecto.inicio ?? efecto.start ?? null,
    fin: efecto.fin ?? efecto.end ?? null,
    intensidad: efecto.intensidad || motor?.plan?.intensidad?.id || null,
    origen: motor?.plan?.origen || motor?.detalle?.origen || 'local'
  })).concat(lista(compilado.omitidos).map((omitido, indice) => ({ id: omitido.id || `omitido-${indice + 1}`, nombre: omitido.nombre || omitido.efectoId || 'Efecto omitido', categoria: 'omitido', omitido: true, motivo: omitido.motivo || omitido.razon || 'No compilado' })));
}

function extraerTextos(transcripcion = {}) {
  const titulos = lista(transcripcion?.titulosGanchos?.titulos).map((item) => ({ tipo: 'titulo', texto: item.texto, inicio: item.inicio, fin: item.fin }));
  const ganchos = lista(transcripcion?.titulosGanchos?.ganchos).map((item) => ({ tipo: 'gancho', texto: item.texto, inicio: item.inicio, fin: item.fin }));
  const flotantes = lista(transcripcion?.textosFlotantes?.textos || transcripcion?.textosFlotantes?.elementos).map((item) => ({ tipo: 'texto_flotante', texto: item.texto, inicio: item.inicio, fin: item.fin }));
  return [...titulos, ...ganchos, ...flotantes].filter((item) => item.texto);
}

function extraerImagenes(entendimiento = {}, modular = null) {
  const frames = lista(entendimiento?.fotogramas?.fotogramas);
  const imagenes = lista(modular?.imagenes);
  return [...imagenes, ...frames].map((item, indice) => ({ id: item.id || `imagen-${indice + 1}`, nombre: item.nombre || item.nombreArchivo || `Imagen ${indice + 1}`, inicio: item.inicio ?? item.segundo ?? null, fin: item.fin ?? null, ruta: item.recurso?.ruta || item.rutaArchivo || item.ruta || '' }));
}

function extraerAnimaciones(modular = null) {
  return lista(modular?.visual?.animaciones?.animaciones).map((item, indice) => ({ id: item.id || `animacion-${indice + 1}`, tipo: item.tipo || 'animacion', elementoId: item.elementoId || null, inicio: item.inicio ?? null, fin: item.fin ?? null, intensidad: item.intensidad || null }));
}

function crearResumen({ efectos, textos, imagenes, animaciones, salida, audio }) {
  return {
    videoFinal: salida?.nombreExportado || null,
    urlPublica: salida?.urlPublica || null,
    efectosUsados: efectos.filter((item) => !item.omitido).length,
    efectosOmitidos: efectos.filter((item) => item.omitido).length,
    textosUsados: textos.length,
    imagenesDisponibles: imagenes.length,
    animacionesUsadas: animaciones.length,
    audio: salida?.audio?.tipo || audio?.tipo || 'no reportado',
    fallbackVisualUsado: Boolean(salida?.ffmpeg?.fallbackVisualUsado)
  };
}

export async function crearReporteFinalEdicion({ entrada, entendimiento, audio = null, transcripcion = null, edicion = null, salida = null, modular = null, opciones = {} } = {}) {
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto) throw new Error('No se puede crear reporte final porque falta carpeta de proyecto.');

  const efectos = extraerEfectosUsados(edicion || salida?.edicion || {});
  const textos = extraerTextos(transcripcion || {});
  const imagenes = extraerImagenes(entendimiento || {}, modular);
  const animaciones = extraerAnimaciones(modular);
  const reporte = {
    ok: true,
    tipo: 'reporte-final-edicion',
    proyectoId: entrada?.proyecto?.id || null,
    perfil: opciones.perfil || entrada?.proyecto?.perfil || 'general',
    plataforma: salida?.plataforma || opciones.plataforma || 'tiktok',
    resumen: crearResumen({ efectos, textos, imagenes, animaciones, salida, audio }),
    efectosUsados: efectos,
    textosUsados: textos,
    imagenesUsadasORevisables: imagenes,
    animacionesUsadas: animaciones,
    audio: salida?.audio || audio || null,
    diagnostico: {
      fallbackVisualUsado: Boolean(salida?.ffmpeg?.fallbackVisualUsado),
      errorFiltroPrincipal: salida?.ffmpeg?.errorFiltroPrincipal || null,
      audioSeguro: salida?.render?.planAudio || null
    },
    recomendaciones: [
      efectos.length ? 'Revisar en Producción los efectos aplicados y desactivar los que no aporten.' : 'No se reportaron efectos; revisar motor visual.',
      textos.length ? 'Validar títulos y textos antes de publicar.' : 'No se reportaron textos; revisar transcripción.',
      imagenes.length ? 'Usar las imágenes/fotogramas como apoyo en la línea de tiempo.' : 'No hay imágenes revisables; revisar extracción de fotogramas o biblioteca.'
    ],
    creadoEn: new Date().toISOString()
  };

  const rutaReporte = path.join(carpetaProyecto, 'reporte-final-edicion.json');
  await escribirJson(rutaReporte, reporte);
  return { ok: true, rutaReporte, nombreArchivo: path.basename(rutaReporte), reporte, resumenTexto: `${texto(reporte.resumen.videoFinal, 'Video final')} · ${reporte.resumen.efectosUsados} efecto(s) · ${reporte.resumen.textosUsados} texto(s) · ${reporte.resumen.animacionesUsadas} animación(es).` };
}

export default crearReporteFinalEdicion;
