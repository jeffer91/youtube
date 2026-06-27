/*
  Bloque 17: Resultado final
  Función: consolidar entendimiento, plan, producción y adaptación en un paquete final revisable.
*/

import fs from 'fs';
import path from 'path';
import {
  asegurarCarpeta,
  escribirJson,
  crearRutaRelativaParaWeb,
  obtenerRutaRaiz
} from '../../comun/archivos.js';
import {
  ETAPAS_AUTOVIDEO,
  ESTADOS_PROYECTO_ETAPAS,
  cargarEstadoProyectoEtapas,
  avanzarEstadoProyectoEtapas,
  marcarErrorEstadoProyectoEtapas,
  guardarResultadoEtapa,
  cargarResultadoEtapa
} from '../../flujo-etapas/flujo-etapas.conexion.js';

function texto(valor, respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function lista(valor) {
  return Array.isArray(valor) ? valor : [];
}

function extraerResultadoEtapa(wrapper = {}) {
  if (wrapper?.resultado?.resultado) return wrapper.resultado.resultado;
  if (wrapper?.datos?.resultado?.resultado) return wrapper.datos.resultado.resultado;
  if (wrapper?.resultado) return wrapper.resultado;
  return wrapper;
}

function obtenerCarpetaProyecto(proyectoId) {
  return path.join(obtenerRutaRaiz(), 'datos', 'proyectos', proyectoId);
}

function obtenerCarpetaResultado(proyectoId) {
  return path.join(obtenerCarpetaProyecto(proyectoId), '05-resultado');
}

function normalizarVideoMaestro(produccion = {}) {
  const salida = produccion.salida || {};
  const video = produccion.videoMaestro || {};
  const ruta = video.ruta || salida.rutaExportada || '';
  return {
    tipo: 'maestro',
    nombre: video.nombre || salida.nombreExportado || (ruta ? path.basename(ruta) : 'video-maestro.mp4'),
    ruta,
    rutaRelativa: ruta ? crearRutaRelativaParaWeb(ruta) : '',
    urlPublica: video.urlPublica || salida.urlPublica || '',
    pesoBytes: video.pesoBytes || salida.pesoBytes || null,
    plataforma: produccion.resumen?.plataformaBase || salida.plataforma || 'maestro',
    formato: salida.formato || 'base',
    estado: ruta && fs.existsSync(ruta) ? 'disponible' : 'referenciado'
  };
}

function normalizarVideosPlataforma(adaptacion = {}) {
  const resultados = lista(adaptacion.resultadoPlataformas?.resultados || adaptacion.resumen?.plataformas);
  return resultados.map((item) => ({
    tipo: 'plataforma',
    plataforma: item.plataforma,
    nombre: item.nombre || item.plataforma,
    formato: item.formato,
    width: item.width || null,
    height: item.height || null,
    estado: item.estado || 'pendiente',
    nombreExportado: item.nombreExportado || '',
    rutaExportada: item.rutaExportada || item.videoDestino || '',
    urlPublica: item.urlPublica || '',
    pesoBytes: item.pesoBytes || null,
    mensaje: item.mensaje || ''
  }));
}

function crearResumenFinal({ estado = {}, entendimiento = {}, plan = {}, produccion = {}, adaptacion = {}, videoMaestro, videosPlataforma }) {
  const plataformasExportadas = videosPlataforma.filter((item) => item.estado === 'exportado');
  const errores = videosPlataforma.filter((item) => item.estado === 'error_render');
  const reporteSalida = produccion.salida?.reporteFinal?.reporte || {};
  return {
    proyectoId: estado.proyectoId,
    nombre: estado.nombre || plan.proyecto?.nombre || produccion.entrada?.proyecto?.nombre || 'Proyecto AutoVideoJeff',
    perfil: plan.proyecto?.perfil || produccion.entrada?.proyecto?.perfil || estado.datos?.perfil || 'general',
    plataformaBase: videoMaestro.plataforma || 'maestro',
    duracionSegundos: numero(entendimiento.analisis?.duracionSegundos || entendimiento.resumen?.duracionSegundos || plan.resumen?.duracionSegundos, 0),
    videoMaestro: videoMaestro.nombre,
    urlVideoMaestro: videoMaestro.urlPublica,
    plataformasTotales: videosPlataforma.length,
    plataformasExportadas: plataformasExportadas.length,
    plataformasConError: errores.length,
    pesoTotalBytes: videosPlataforma.reduce((total, item) => total + numero(item.pesoBytes, 0), numero(videoMaestro.pesoBytes, 0)),
    elementosPlan: plan.resumen?.totalElementos || plan.planProduccion?.elementos?.length || 0,
    efectosUsados: reporteSalida.resumen?.efectosUsados || produccion.auditoria?.edicion?.filtrosAplicados || 0,
    textosUsados: reporteSalida.resumen?.textosUsados || plan.resumen?.textos || 0,
    recursosUsados: plan.resumen?.recursos || 0,
    animacionesUsadas: reporteSalida.resumen?.animacionesUsadas || plan.resumen?.animaciones || 0,
    sfxPremium: Boolean(produccion.edicion?.sonidos?.sfxPremium?.aplicado || produccion.edicion?.sonidos?.sfxPremium),
    efectosPremium: Boolean(produccion.edicion?.visualDinamico?.motorEfectos?.premium?.aplicado || produccion.edicion?.render?.motorEfectos?.premium?.aplicado),
    listoParaPublicar: Boolean(videoMaestro.urlPublica && (videosPlataforma.length === 0 || plataformasExportadas.length > 0) && errores.length === 0)
  };
}

function crearChecklist({ entendimiento = {}, plan = {}, produccion = {}, adaptacion = {}, resumen = {} }) {
  return [
    { id: 'entendimiento', nombre: 'Entendimiento generado', ok: Boolean(entendimiento.ok || entendimiento.analisis || entendimiento.resumen), detalle: 'Análisis base, transcripción, fotogramas y momentos clave.' },
    { id: 'plan', nombre: 'Plan de edición generado', ok: Boolean(plan.planProduccion || plan.resumen), detalle: `${resumen.elementosPlan} elemento(s) de plan.` },
    { id: 'produccion', nombre: 'Video maestro producido', ok: Boolean(produccion.videoMaestro?.urlPublica || produccion.salida?.urlPublica), detalle: resumen.videoMaestro || 'Video maestro.' },
    { id: 'adaptacion', nombre: 'Adaptación a plataformas', ok: Boolean(adaptacion.resultadoPlataformas || resumen.plataformasExportadas > 0), detalle: `${resumen.plataformasExportadas}/${resumen.plataformasTotales} plataforma(s) exportada(s).` },
    { id: 'premium', nombre: 'Capas premium aplicadas', ok: Boolean(resumen.efectosPremium || resumen.sfxPremium), detalle: `Visual: ${resumen.efectosPremium ? 'sí' : 'no'} · SFX: ${resumen.sfxPremium ? 'sí' : 'no'}.` }
  ];
}

function crearRecomendacionesFinales({ resumen = {}, videosPlataforma = [] }) {
  const recomendaciones = [];
  if (resumen.listoParaPublicar) recomendaciones.push('El paquete final está listo para revisión humana y publicación.');
  else recomendaciones.push('Revisar pendientes antes de publicar el paquete final.');
  if (resumen.plataformasConError) recomendaciones.push('Revisar las plataformas con error de render y volver a ejecutar Adaptación.');
  if (!resumen.urlVideoMaestro) recomendaciones.push('El video maestro no tiene URL pública; revisar exportación de Producción.');
  if (videosPlataforma.length) recomendaciones.push('Validar manualmente el encuadre y audio en cada plataforma antes de subir.');
  if (resumen.efectosPremium || resumen.sfxPremium) recomendaciones.push('Revisar que los efectos premium y SFX no saturen la edición final.');
  return recomendaciones;
}

function crearPublicacionSugerida({ resumen = {}, videosPlataforma = [] }) {
  return videosPlataforma.map((item) => ({
    plataforma: item.plataforma,
    estado: item.estado,
    archivo: item.nombreExportado || item.nombre,
    urlPublica: item.urlPublica || '',
    sugerencia: item.estado === 'exportado'
      ? `Publicar o programar en ${item.nombre || item.plataforma} después de revisión visual.`
      : `Revisar ${item.nombre || item.plataforma} antes de publicar.`
  })).concat([{ plataforma: 'maestro', estado: resumen.urlVideoMaestro ? 'disponible' : 'pendiente', archivo: resumen.videoMaestro, urlPublica: resumen.urlVideoMaestro, sugerencia: 'Conservar como archivo maestro de respaldo.' }]);
}

function escaparHtml(valor = '') {
  return String(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function crearHtmlResultado(resultado = {}) {
  const resumen = resultado.resumen || {};
  const videos = resultado.videos?.plataformas || [];
  const checklist = resultado.checklist || [];
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Resultado final - ${escaparHtml(resumen.nombre)}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;background:#f8fafc;color:#0f172a}main{max-width:1100px;margin:0 auto;padding:28px}section{background:white;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:14px 0;box-shadow:0 10px 24px rgba(15,23,42,.06)}h1,h2{margin:0 0 10px}.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.kpis div,.card{border:1px solid #e2e8f0;border-radius:14px;padding:12px;background:#f8fafc}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}.ok{color:#166534}.warn{color:#9a3412}a{color:#2563eb;font-weight:700}small{color:#64748b;font-weight:700}
  </style>
</head>
<body>
  <main>
    <section>
      <small>AutoVideoJeff · Resultado final</small>
      <h1>${escaparHtml(resumen.nombre)}</h1>
      <p>${resumen.listoParaPublicar ? 'Paquete listo para revisión y publicación.' : 'Paquete con elementos pendientes de revisión.'}</p>
    </section>
    <section><h2>Resumen</h2><div class="kpis">
      <div><small>Plataformas</small><h2>${resumen.plataformasExportadas}/${resumen.plataformasTotales}</h2></div>
      <div><small>Elementos plan</small><h2>${resumen.elementosPlan}</h2></div>
      <div><small>Efectos</small><h2>${resumen.efectosUsados}</h2></div>
      <div><small>Textos</small><h2>${resumen.textosUsados}</h2></div>
    </div></section>
    <section><h2>Video maestro</h2><p><strong>${escaparHtml(resumen.videoMaestro || 'Sin maestro')}</strong></p>${resumen.urlVideoMaestro ? `<p><a href="${escaparHtml(resumen.urlVideoMaestro)}">Abrir video maestro</a></p>` : ''}</section>
    <section><h2>Plataformas</h2><div class="cards">${videos.map((item) => `<div class="card"><strong>${escaparHtml(item.nombre || item.plataforma)}</strong><p>${escaparHtml(item.estado)} · ${escaparHtml(item.formato || '')}</p>${item.urlPublica ? `<a href="${escaparHtml(item.urlPublica)}">Abrir exportación</a>` : '<span class="warn">Sin exportación</span>'}</div>`).join('')}</div></section>
    <section><h2>Checklist</h2>${checklist.map((item) => `<p class="${item.ok ? 'ok' : 'warn'}"><strong>${item.ok ? 'OK' : 'Revisar'} · ${escaparHtml(item.nombre)}</strong><br><small>${escaparHtml(item.detalle)}</small></p>`).join('')}</section>
  </main>
</body>
</html>`;
}

async function escribirHtmlResultado({ proyectoId, resultado }) {
  const carpetaResultado = obtenerCarpetaResultado(proyectoId);
  asegurarCarpeta(carpetaResultado);
  const rutaHtml = path.join(carpetaResultado, 'resultado-final.html');
  await fs.promises.writeFile(rutaHtml, crearHtmlResultado(resultado), 'utf-8');
  return {
    ruta: rutaHtml,
    rutaRelativa: crearRutaRelativaParaWeb(rutaHtml),
    nombreArchivo: path.basename(rutaHtml)
  };
}

async function escribirManifiestoFinal({ proyectoId, resultado }) {
  const carpetaResultado = obtenerCarpetaResultado(proyectoId);
  asegurarCarpeta(carpetaResultado);
  const rutaManifest = path.join(carpetaResultado, 'manifest-publicacion.json');
  await escribirJson(rutaManifest, {
    ok: true,
    proyectoId,
    creadoEn: new Date().toISOString(),
    resumen: resultado.resumen,
    videos: resultado.videos,
    publicacionSugerida: resultado.publicacionSugerida,
    entregables: resultado.entregables
  });
  return {
    ruta: rutaManifest,
    rutaRelativa: crearRutaRelativaParaWeb(rutaManifest),
    nombreArchivo: path.basename(rutaManifest)
  };
}

export async function procesarResultadoFinalProyectoEtapa({ proyectoId, opciones = {}, solicitud = {} } = {}) {
  if (!proyectoId) throw new Error('Falta proyectoId para preparar resultado final.');
  const estadoInicial = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
  if (!estadoInicial) throw new Error('No existe estado-proyecto.json. Primero crea el proyecto.');

  try {
    await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.RESULTADO,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.EXPORTANDO,
      mensaje: 'Preparando paquete de resultado final.'
    });

    const [entendimientoGuardado, planGuardado, produccionGuardada, adaptacionGuardada] = await Promise.all([
      cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ENTENDIMIENTO, valorPorDefecto: {} }),
      cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.PLAN_EDICION, valorPorDefecto: {} }),
      cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.PRODUCCION, valorPorDefecto: null }),
      cargarResultadoEtapa({ proyectoId, etapa: ETAPAS_AUTOVIDEO.ADAPTACION, valorPorDefecto: {} })
    ]);

    if (!produccionGuardada) throw new Error('No se puede preparar resultado final porque no existe producción maestro.');
    const estadoProcesando = await cargarEstadoProyectoEtapas({ proyectoId, crearSiFalta: false });
    const entendimiento = extraerResultadoEtapa(entendimientoGuardado);
    const plan = extraerResultadoEtapa(planGuardado);
    const produccion = extraerResultadoEtapa(produccionGuardada);
    const adaptacion = extraerResultadoEtapa(adaptacionGuardada);
    const videoMaestro = normalizarVideoMaestro(produccion);
    const videosPlataforma = normalizarVideosPlataforma(adaptacion);
    const resumen = crearResumenFinal({ estado: estadoProcesando, entendimiento, plan, produccion, adaptacion, videoMaestro, videosPlataforma });
    const checklist = crearChecklist({ entendimiento, plan, produccion, adaptacion, resumen });

    const resultadoFinal = {
      ok: true,
      etapa: ETAPAS_AUTOVIDEO.RESULTADO,
      proyectoId,
      resumen,
      videos: {
        maestro: videoMaestro,
        plataformas: videosPlataforma
      },
      reporteFinalEdicion: produccion.salida?.reporteFinal || null,
      checklist,
      recomendaciones: crearRecomendacionesFinales({ resumen, videosPlataforma }),
      publicacionSugerida: crearPublicacionSugerida({ resumen, videosPlataforma }),
      fuentes: {
        entendimiento: Boolean(entendimientoGuardado),
        plan: Boolean(planGuardado),
        produccion: Boolean(produccionGuardada),
        adaptacion: Boolean(adaptacionGuardada)
      },
      solicitud: { ...opciones, ...solicitud },
      entregables: {},
      creadoEn: new Date().toISOString()
    };

    const html = await escribirHtmlResultado({ proyectoId, resultado: resultadoFinal });
    resultadoFinal.entregables.html = html;
    const manifest = await escribirManifiestoFinal({ proyectoId, resultado: resultadoFinal });
    resultadoFinal.entregables.manifest = manifest;

    const guardado = await guardarResultadoEtapa({
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.RESULTADO,
      resultado: resultadoFinal,
      metadata: {
        bloque: 17,
        tipo: 'resultado-final',
        origen: 'POST /api/proyectos/:proyectoId/resultado/exportar'
      }
    });
    resultadoFinal.entregables.json = {
      ruta: guardado.ruta,
      rutaRelativa: crearRutaRelativaParaWeb(guardado.ruta),
      nombreArchivo: path.basename(guardado.ruta)
    };
    await escribirJson(guardado.ruta, { ok: true, resultado: resultadoFinal, metadata: { bloque: 17, tipo: 'resultado-final' }, actualizadoEn: new Date().toISOString() });

    const estadoFinal = await avanzarEstadoProyectoEtapas({
      proyectoId,
      etapaDestino: ETAPAS_AUTOVIDEO.RESULTADO,
      estadoDestino: ESTADOS_PROYECTO_ETAPAS.FINALIZADO,
      archivoGenerado: guardado.ruta,
      mensaje: 'Resultado final preparado y proyecto finalizado.'
    });

    return {
      ok: true,
      proyectoId,
      etapa: ETAPAS_AUTOVIDEO.RESULTADO,
      estado: estadoFinal,
      resultado: resultadoFinal,
      resumen,
      archivo: guardado,
      mensaje: 'Resultado final preparado correctamente.'
    };
  } catch (error) {
    await marcarErrorEstadoProyectoEtapas({ proyectoId, etapa: ETAPAS_AUTOVIDEO.RESULTADO, error, mensaje: 'Error preparando resultado final.' }).catch(() => null);
    throw error;
  }
}
