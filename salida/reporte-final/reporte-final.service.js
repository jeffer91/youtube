/*
  Nueva etapa estructural - revisión final
  Función: crear reporte final con efectos, imágenes, animaciones, textos, audio, trazabilidad del plan y diagnóstico del resultado.
*/

import path from 'path';
import { escribirJson } from '../../comun/archivos.js';

function lista(valor) { return Array.isArray(valor) ? valor : []; }
function texto(valor, respaldo = '') { const limpio = String(valor || '').replace(/\s+/g, ' ').trim(); return limpio || respaldo; }
function numero(valor, respaldo = 0) { const n = Number(valor); return Number.isFinite(n) ? n : respaldo; }
function unirListasSinDuplicar(...listas) { const vistos = new Set(); const salida = []; listas.flat().filter(Boolean).forEach((item, indice) => { const clave = item.id || item.efectoId || item.nombre || item.texto || item.ruta || `${item.tipo || 'item'}-${indice}`; if (vistos.has(clave)) return; vistos.add(clave); salida.push(item); }); return salida; }

function obtenerMotorEfectos(edicion = {}) {
  return edicion?.visualDinamico?.motorEfectos || edicion?.motorEfectos || edicion?.edicionDinamica?.motorEfectos || edicion?.render?.motorEfectos || null;
}

function extraerEfectosUsados(edicion = {}, modular = null) {
  const motor = obtenerMotorEfectos(edicion);
  const efectosMotor = lista(motor?.plan?.efectos || motor?.plan?.items || motor?.detalle?.efectos);
  const efectosPlanVisual = lista(edicion?.visualDinamico?.eventosVisuales).filter((item) => String(item.tipo || '').includes('efecto') || String(item.efecto || '').trim());
  const efectosModular = lista(modular?.visual?.efectos?.efectos || modular?.visual?.efectos?.plan?.efectos || modular?.produccion?.elementos).filter((item) => ['efecto', 'zoom'].includes(item.tipo) || item.efectoId);
  const efectos = unirListasSinDuplicar(efectosMotor, efectosPlanVisual, efectosModular);
  const compilado = motor?.compilado || {};
  return efectos.map((efecto, indice) => ({
    id: efecto.id || efecto.efectoId || `efecto-${indice + 1}`,
    nombre: efecto.nombre || efecto.efectoId || efecto.efecto || efecto.id || efecto.datos?.tipo || `Efecto ${indice + 1}`,
    categoria: efecto.categoria || efecto.tipo || efecto.datos?.categoria || 'visual',
    inicio: efecto.inicio ?? efecto.start ?? efecto.datos?.inicio ?? null,
    fin: efecto.fin ?? efecto.end ?? efecto.datos?.fin ?? null,
    intensidad: efecto.intensidad || motor?.plan?.intensidad?.id || efecto.datos?.intensidad || null,
    origen: efecto.origen || motor?.plan?.origen || motor?.detalle?.origen || 'local',
    desdePlan: String(efecto.origen || efecto.tipo || '').includes('plan')
  })).concat(lista(compilado.omitidos).map((omitido, indice) => ({ id: omitido.id || `omitido-${indice + 1}`, nombre: omitido.nombre || omitido.efectoId || 'Efecto omitido', categoria: 'omitido', omitido: true, motivo: omitido.motivo || omitido.razon || 'No compilado' })));
}

function extraerTextos(transcripcion = {}, modular = null, edicionDinamica = null) {
  const titulos = lista(transcripcion?.titulosGanchos?.titulos).map((item) => ({ tipo: 'titulo', texto: item.texto, inicio: item.inicio, fin: item.fin }));
  const ganchos = lista(transcripcion?.titulosGanchos?.ganchos).map((item) => ({ tipo: 'gancho', texto: item.texto, inicio: item.inicio, fin: item.fin }));
  const flotantes = lista(transcripcion?.textosFlotantes?.textos || transcripcion?.textosFlotantes?.elementos).map((item) => ({ tipo: 'texto_flotante', texto: item.texto, inicio: item.inicio, fin: item.fin }));
  const planTextos = lista(edicionDinamica?.eventosTextoPlan || edicionDinamica?.puentePlanEdicion?.eventosTextoPlan).map((item) => ({ tipo: item.tipo || 'texto_plan', texto: item.texto || item.textoPantalla || item.subtitulo || item.nombre, inicio: item.inicio, fin: item.fin, origen: 'plan' }));
  const produccionTextos = lista(modular?.produccion?.elementos).filter((item) => ['texto', 'subtitulo'].includes(item.tipo)).map((item) => ({ tipo: item.tipo, texto: item.datos?.texto || item.nombre || item.descripcion, inicio: item.inicio, fin: item.fin }));
  return unirListasSinDuplicar(titulos, ganchos, flotantes, planTextos, produccionTextos).filter((item) => item.texto);
}

function extraerImagenes(entendimiento = {}, modular = null) {
  const frames = lista(entendimiento?.fotogramas?.fotogramas);
  const imagenes = lista(modular?.imagenes);
  const produccionImagenes = lista(modular?.produccion?.elementos).filter((item) => ['imagen', 'recurso', 'grafico', 'fondo'].includes(item.tipo));
  return unirListasSinDuplicar(imagenes, frames, produccionImagenes).map((item, indice) => ({ id: item.id || `imagen-${indice + 1}`, nombre: item.nombre || item.nombreArchivo || item.datos?.nombre || `Imagen ${indice + 1}`, inicio: item.inicio ?? item.segundo ?? item.datos?.inicio ?? null, fin: item.fin ?? item.datos?.fin ?? null, ruta: item.recurso?.ruta || item.rutaArchivo || item.ruta || item.datos?.ruta || '' }));
}

function extraerAnimaciones(edicion = {}, modular = null) {
  const animacionesRender = lista(edicion?.visualDinamico?.animacionesRender?.animaciones || edicion?.visualDinamico?.animacionesRender?.eventos || edicion?.render?.animacionesRender?.animaciones).map((item) => ({ ...item, renderizada: true, origen: item.origen || 'render-ffmpeg', desdePlan: Boolean(item.desdePlan) }));
  const animacionesModular = lista(modular?.visual?.animaciones?.animaciones || modular?.visual?.animaciones).map((item) => ({ ...item, renderizada: false, origen: 'plan-modular' }));
  const animacionesProduccion = lista(modular?.produccion?.elementos).filter((item) => item.tipo === 'animacion').map((item) => ({ ...item, renderizada: false, origen: 'produccion' }));
  const animacionesEdicion = lista(edicion?.visualDinamico?.animaciones?.animaciones || edicion?.visualDinamico?.animaciones || edicion?.animaciones).map((item) => ({ ...item, renderizada: false, origen: item.origen || 'edicion' }));
  return unirListasSinDuplicar(animacionesRender, animacionesModular, animacionesProduccion, animacionesEdicion).map((item, indice) => ({ id: item.id || `animacion-${indice + 1}`, tipo: item.tipo || item.datos?.tipo || 'animacion', elementoId: item.elementoId || item.idElemento || null, inicio: item.inicio ?? item.datos?.inicio ?? null, fin: item.fin ?? item.datos?.fin ?? null, intensidad: item.intensidad || item.datos?.intensidad || null, renderizada: Boolean(item.renderizada), origen: item.origen || 'desconocido', desdePlan: Boolean(item.desdePlan) || String(item.origen || item.tipo || '').includes('plan') }));
}

function extraerPuentePlanEdicion(edicionDinamica = null, opciones = {}) {
  return edicionDinamica?.puentePlanEdicion || opciones?.puentePlanEdicion || {
    ok: Boolean(edicionDinamica?.instruccionesEdicion?.length),
    resumen: edicionDinamica?.resumenPlanEjecutable || null,
    instrucciones: edicionDinamica?.instruccionesEdicion || [],
    eventosVisualesPlan: edicionDinamica?.eventosVisualesPlan || [],
    eventosSonidoPlan: edicionDinamica?.eventosSonidoPlan || [],
    eventosTextoPlan: edicionDinamica?.eventosTextoPlan || []
  };
}

function crearTimelineAplicada({ edicionDinamica = null, edicion = null } = {}) {
  const mapaTiempo = lista(edicionDinamica?.mapaTiempo).map((item, index) => ({ id: item.id || `mapa-${index + 1}`, tipo: item.tipo || 'corte', pista: item.tipo || 'edicion', inicio: item.inicio ?? item.inicioGlobal ?? 0, fin: item.fin ?? item.finGlobal ?? null, estado: 'enviado_a_edicion', origen: item.origen || 'plan', aplicado: false, motivo: item.motivo || item.datos?.motivo || '' }));
  const visuales = lista(edicion?.visualDinamico?.eventosVisuales).map((item, index) => ({ id: item.id || `visual-${index + 1}`, tipo: item.tipo || 'visual', pista: 'visual', inicio: item.inicio ?? 0, fin: item.fin ?? null, estado: edicion?.visualDinamico?.omitido ? 'omitido' : 'aplicado', origen: item.origen || 'visual-dinamico', aplicado: !edicion?.visualDinamico?.omitido, motivo: item.motivo || '' }));
  const sonidos = lista(edicion?.sonidos?.eventosSonido).map((item, index) => ({ id: item.id || `sfx-${index + 1}`, tipo: item.sonido || item.tipo || 'audio-sfx', pista: 'audio-sfx', inicio: item.tiempo ?? item.inicio ?? 0, fin: item.fin ?? null, estado: edicion?.sonidos?.omitido ? 'omitido' : 'aplicado', origen: item.desdePlan ? 'plan-audio-sfx' : item.origenVisual || 'sonidos-edicion', aplicado: !edicion?.sonidos?.omitido, motivo: item.motivo || '' }));
  const animaciones = lista(edicion?.visualDinamico?.animacionesRender?.eventos || edicion?.visualDinamico?.animacionesRender?.animaciones).map((item, index) => ({ id: item.id || `animacion-${index + 1}`, tipo: item.tipo || 'animacion', pista: 'animaciones', inicio: item.inicio ?? 0, fin: item.fin ?? null, estado: 'renderizada', origen: item.origen || 'render-ffmpeg', aplicado: true, motivo: item.motivo || '' }));
  const timeline = unirListasSinDuplicar(mapaTiempo, visuales, sonidos, animaciones).sort((a, b) => numero(a.inicio, 0) - numero(b.inicio, 0));
  return timeline.map((item, index) => ({ ...item, orden: index + 1 }));
}

function crearAuditoriaPlan({ puentePlan = {}, edicionDinamica = null, edicion = null, salida = null } = {}) {
  const visual = edicion?.visualDinamico || {};
  const sonidos = edicion?.sonidos || {};
  const resumenPuente = puentePlan?.resumen || edicionDinamica?.resumenPlanEjecutable || {};
  const visualesDesdePlan = visual.visualesDesdePlan || { total: 0, zooms: 0, efectos: 0, animaciones: 0, transiciones: 0, textos: 0 };
  const resumenPlanSonido = sonidos.resumenPlanSonido || { total: 0, aplicados: 0, omitidos: 0, descartados: {} };
  const instrucciones = lista(puentePlan?.instrucciones || edicionDinamica?.instruccionesEdicion);
  const aplicados = {
    visualesDesdePlan: visualesDesdePlan.total || 0,
    sfxDesdePlan: resumenPlanSonido.aplicados || 0,
    animacionesRenderizadas: visual.animacionesRender?.total || visual.animacionesRender?.eventos?.length || 0,
    sonidosMezclados: sonidos.eventosSonido?.length || 0
  };
  const omitidos = [];
  if (visual.omitido) omitidos.push({ tipo: 'visual', motivo: visual.mensaje || 'Visual dinámico omitido.', error: visual.errorControlado || null });
  if (sonidos.omitido) omitidos.push({ tipo: 'audio-sfx', motivo: sonidos.mensaje || 'Sonidos omitidos.', error: null });
  if (salida?.ffmpeg?.fallbackVisualUsado) omitidos.push({ tipo: 'filtro-visual-avanzado', motivo: 'Se usó render seguro por fallo del filtro principal.', error: salida.ffmpeg.errorFiltroPrincipal || null });
  if (resumenPlanSonido.omitidos > 0) omitidos.push({ tipo: 'sfx-plan', motivo: `${resumenPlanSonido.omitidos} SFX del plan no se aplicaron después de filtros de seguridad.`, detalle: resumenPlanSonido.descartados || {} });
  return {
    ok: true,
    planEjecutableDetectado: Boolean(puentePlan?.ok || instrucciones.length),
    proveedorPlan: puentePlan?.proveedor || 'desconocido',
    instruccionesPlan: resumenPuente.totalInstrucciones || instrucciones.length || 0,
    resumenPlan: resumenPuente,
    aplicados,
    omitidos,
    fallback: {
      visual: Boolean(salida?.ffmpeg?.fallbackVisualUsado),
      errorFiltroPrincipal: salida?.ffmpeg?.errorFiltroPrincipal || null,
      visualDinamicoOmitido: Boolean(visual.omitido),
      sonidosOmitidos: Boolean(sonidos.omitido)
    },
    visualesDesdePlan,
    sonidosDesdePlan: resumenPlanSonido,
    estado: omitidos.length ? 'con_observaciones' : 'ok'
  };
}

function crearResumen({ efectos, textos, imagenes, animaciones, salida, audio, auditoriaPlan }) {
  return {
    videoFinal: salida?.nombreExportado || null,
    urlPublica: salida?.urlPublica || null,
    efectosUsados: efectos.filter((item) => !item.omitido).length,
    efectosOmitidos: efectos.filter((item) => item.omitido).length,
    textosUsados: textos.length,
    imagenesDisponibles: imagenes.length,
    animacionesUsadas: animaciones.length,
    animacionesRenderizadas: animaciones.filter((item) => item.renderizada).length,
    animacionesDesdePlan: animaciones.filter((item) => item.desdePlan).length,
    audio: salida?.audio?.tipo || audio?.tipo || 'no reportado',
    sfxDesdePlanAplicados: auditoriaPlan?.sonidosDesdePlan?.aplicados || 0,
    sfxDesdePlanTotal: auditoriaPlan?.sonidosDesdePlan?.total || 0,
    visualesDesdePlan: auditoriaPlan?.visualesDesdePlan?.total || 0,
    instruccionesPlan: auditoriaPlan?.instruccionesPlan || 0,
    omitidosControlados: auditoriaPlan?.omitidos?.length || 0,
    fallbackVisualUsado: Boolean(salida?.ffmpeg?.fallbackVisualUsado)
  };
}

function crearRecomendaciones({ efectos, textos, imagenes, animaciones, auditoriaPlan }) {
  return [
    efectos.length ? 'Revisar en Producción los efectos aplicados y desactivar los que no aporten.' : 'No se reportaron efectos; revisar motor visual.',
    textos.length ? 'Validar títulos y textos antes de publicar.' : 'No se reportaron textos; revisar transcripción.',
    imagenes.length ? 'Usar las imágenes/fotogramas como apoyo en la línea de tiempo.' : 'No hay imágenes revisables; revisar extracción de fotogramas o biblioteca.',
    animaciones.some((item) => item.renderizada) ? 'Las animaciones visibles ya fueron renderizadas en el MP4 final.' : 'No se reportaron animaciones renderizadas; revisar motor de animaciones.',
    auditoriaPlan?.omitidos?.length ? 'Revisar los omitidos controlados antes de publicar; el video se exportó, pero hay elementos que se simplificaron o no se aplicaron.' : 'La auditoría final no reporta omitidos críticos.'
  ];
}

export async function crearReporteFinalEdicion({ entrada, entendimiento, audio = null, transcripcion = null, edicionDinamica = null, edicion = null, salida = null, modular = null, opciones = {} } = {}) {
  const carpetaProyecto = entrada?.rutas?.carpetaProyecto;
  if (!carpetaProyecto) throw new Error('No se puede crear reporte final porque falta carpeta de proyecto.');

  const puentePlan = extraerPuentePlanEdicion(edicionDinamica, opciones);
  const efectos = extraerEfectosUsados(edicion || salida?.edicion || {}, modular);
  const textos = extraerTextos(transcripcion || {}, modular, edicionDinamica);
  const imagenes = extraerImagenes(entendimiento || {}, modular);
  const animaciones = extraerAnimaciones(edicion || salida?.edicion || {}, modular);
  const timelineAplicada = crearTimelineAplicada({ edicionDinamica, edicion: edicion || salida?.edicion || {} });
  const auditoriaPlan = crearAuditoriaPlan({ puentePlan, edicionDinamica, edicion: edicion || salida?.edicion || {}, salida });

  const reporte = {
    ok: true,
    tipo: 'reporte-final-edicion',
    version: '2.0.0-auditoria-plan',
    proyectoId: entrada?.proyecto?.id || null,
    perfil: opciones.perfil || entrada?.proyecto?.perfil || modular?.perfil?.id || 'general',
    plataforma: salida?.plataforma || opciones.plataforma || 'tiktok',
    resumen: crearResumen({ efectos, textos, imagenes, animaciones, salida, audio, auditoriaPlan }),
    trazabilidadPlan: {
      proveedor: auditoriaPlan.proveedorPlan,
      planEjecutableDetectado: auditoriaPlan.planEjecutableDetectado,
      instrucciones: auditoriaPlan.instruccionesPlan,
      visualesDesdePlan: auditoriaPlan.visualesDesdePlan,
      sonidosDesdePlan: auditoriaPlan.sonidosDesdePlan,
      resumenPlan: auditoriaPlan.resumenPlan
    },
    timelineEditorialAplicada: {
      total: timelineAplicada.length,
      marcadores: timelineAplicada
    },
    efectosUsados: efectos,
    textosUsados: textos,
    imagenesUsadasORevisables: imagenes,
    animacionesUsadas: animaciones,
    audio: salida?.audio || audio || null,
    auditoriaEdicionFinal: auditoriaPlan,
    diagnostico: {
      fallbackVisualUsado: Boolean(salida?.ffmpeg?.fallbackVisualUsado),
      errorFiltroPrincipal: salida?.ffmpeg?.errorFiltroPrincipal || null,
      audioSeguro: salida?.render?.planAudio || null,
      produccionConTimeline: Boolean(modular?.produccion?.lineaTiempo || timelineAplicada.length),
      animacionesRenderizadas: animaciones.filter((item) => item.renderizada).length,
      sfxPlanAplicados: auditoriaPlan.sonidosDesdePlan?.aplicados || 0,
      sfxPlanTotal: auditoriaPlan.sonidosDesdePlan?.total || 0,
      visualesPlanTotal: auditoriaPlan.visualesDesdePlan?.total || 0,
      omitidosControlados: auditoriaPlan.omitidos
    },
    recomendaciones: crearRecomendaciones({ efectos, textos, imagenes, animaciones, auditoriaPlan }),
    creadoEn: new Date().toISOString()
  };

  const rutaReporte = path.join(carpetaProyecto, 'reporte-final-edicion.json');
  await escribirJson(rutaReporte, reporte);
  return { ok: true, rutaReporte, nombreArchivo: path.basename(rutaReporte), reporte, resumenTexto: `${texto(reporte.resumen.videoFinal, 'Video final')} · ${reporte.resumen.efectosUsados} efecto(s) · ${reporte.resumen.textosUsados} texto(s) · ${reporte.resumen.animacionesRenderizadas} animación(es) · ${reporte.resumen.sfxDesdePlanAplicados}/${reporte.resumen.sfxDesdePlanTotal} SFX plan.` };
}

export default crearReporteFinalEdicion;
