import fs from 'fs';
import os from 'os';
import path from 'path';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta archivo requerido: ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(ruta, claves) {
  const contenido = leer(ruta);
  for (const clave of claves) exigir(contenido.includes(clave), `${ruta} no contiene conexión requerida: ${clave}`);
  return contenido;
}

function json(ruta) {
  return JSON.parse(leer(ruta));
}

function crearPlanPrueba() {
  return {
    proyecto: { id: 'check-produccion-editorial', perfil: '11-contra-11', plataforma: 'tiktok', modoEdicion: 'revision_completa' },
    resumen: { duracionTotalSegundos: 48 },
    planEjecutable: {
      proveedor: 'verificacion-local',
      timeline: [
        { id: 'cut-1', tipo: 'corte', inicio: 0.5, fin: 6.5, accion: 'corte inicial', motivo: 'Gancho.' },
        { id: 'txt-1', tipo: 'texto', inicio: 4, fin: 6, textoPantalla: 'Punto clave', motivo: 'Refuerzo visual.' },
        { id: 'zoom-1', tipo: 'zoom', inicio: 8, fin: 10, accion: 'zoom de énfasis', motivo: 'Momento fuerte.' },
        { id: 'fx-1', tipo: 'efecto', inicio: 12, fin: 13, efecto: 'shake suave', motivo: 'Golpe visual.' },
        { id: 'anim-1', tipo: 'animacion', inicio: 14, fin: 16, textoPantalla: 'Dato', accion: 'lower third', motivo: 'Contexto.' },
        { id: 'tr-1', tipo: 'transicion', inicio: 18, fin: 18.6, transicion: 'flash blanco', motivo: 'Cambio de bloque.' },
        { id: 'sfx-1', tipo: 'audio-sfx', inicio: 18, fin: 18.3, sonido: 'whoosh', motivo: 'Transición sonora.' },
        { id: 'sfx-2', tipo: 'audio-sfx', inicio: 25, fin: 25.2, sonido: 'hit', motivo: 'Énfasis sonoro.' }
      ]
    },
    planProduccion: { id: 'plan-check-produccion', duracionSegundos: 48, elementos: [{ id: 'prod-texto', tipo: 'texto', inicio: 4, fin: 6, nombre: 'Texto plan' }, { id: 'prod-zoom', tipo: 'zoom', inicio: 8, fin: 10, nombre: 'Zoom plan' }] }
  };
}

function verificarPackage() {
  const pkg = json('package.json');
  exigir(pkg.type === 'module', 'package.json debe mantener type=module.');
  exigir(pkg.scripts?.['check:produccion-editorial'], 'Falta script check:produccion-editorial.');
  exigir(pkg.scripts?.['check:produccion-editorial-funcional'], 'Falta script check:produccion-editorial-funcional.');
  exigir(pkg.scripts['check:produccion-editorial'].includes('verificar-produccion-timeline-editorial.js'), 'check:produccion-editorial no ejecuta verificación de timeline.');
  exigir(pkg.scripts['check:produccion-editorial'].includes('verificar-produccion-editorial-conexiones.js'), 'check:produccion-editorial no ejecuta verificación funcional de conexiones.');
}

function verificarConexionesEstaticas() {
  contiene('etapas/03-produccion/procesar-produccion-maestro.service.js', ['construirInstruccionesEdicionDesdePlan', 'crearEdicionDinamicaDesdePlan', 'editarVideo({ entrada, entendimiento, audio: null, transcripcion, edicionDinamica', 'prepararSalida({ entrada, entendimiento, audio: null, transcripcion, edicionDinamica, edicion', 'construirTimelineEditorialProduccion({ plan, edicion, salida, videoBase, edicionDinamica })', 'puentePlanEdicion', 'instruccionesEdicionPlan', 'marcadoresProduccion']);
  contiene('editar/edicion-dinamica/visual/visual.conexion.js', ['generarEventosVisualesDinamicos', 'construirFiltroVisualFfmpeg', 'visualesDesdePlan', 'animacionesRender', 'eventosVisuales']);
  contiene('editar/edicion-dinamica/sonidos/sonidos.conexion.js', ['crearEventosSonido({ visualDinamico, edicionDinamica, config, opciones })', 'eventosSonidoPlan', 'resumenPlanSonido', 'mezclarSonidosEdicion']);
  contiene('salida/exportar-simple/exportar.service.js', ['crearReporteFinalEdicion({ entrada, entendimiento, audio, transcripcion, edicionDinamica, edicion', 'fallbackVisualUsado', 'reporteFinal']);
  contiene('app/etapas-ui/produccion-maestro-ui.js', ['renderResultado', 'renderTimeline', 'renderDetalle', 'sincronizarPreviewConMarcador', 'actualizarMarcadorActivoPorTiempo', 'produccionMaestroFiltroPista', 'produccionMaestroVideo', 'data-marcador-action']);
  contiene('app/produccion-editorial.css', ['.produccion-maestro-timeline-item.is-active', '.produccion-maestro-panel--preview.is-synced', '.produccion-maestro-marker-actions']);
}

function verificarErroresBasicos() {
  const ui = leer('app/etapas-ui/produccion-maestro-ui.js');
  exigir(!ui.includes('innerHTML = undefined'), 'UI contiene asignación innerHTML indefinida.');
  exigir(!ui.includes('addEventListener(\'click\', undefined'), 'UI contiene listener indefinido.');

  const sonidosConfig = leer('editar/edicion-dinamica/sonidos/sonidos.config.js');
  for (const sfx of ['pop', 'click', 'whoosh', 'hit', 'riser', 'notification', 'beep', 'intro', 'outro']) {
    exigir(sonidosConfig.includes(`${sfx}:`), `Falta sonido base para ${sfx}.`);
  }
}

async function verificarFlujoFuncional() {
  const { construirInstruccionesEdicionDesdePlan } = await import('../etapas/03-produccion/aplicar-plan-ejecutable-edicion.service.js');
  const { construirTimelineEditorialProduccion } = await import('../etapas/03-produccion/construir-marcadores-produccion.service.js');
  const { generarEventosVisualesDinamicos } = await import('../editar/edicion-dinamica/visual/generar-eventos-visuales.service.js');
  const { generarAnimacionesFfmpeg } = await import('../editar/edicion-dinamica/visual/generar-animaciones-ffmpeg.service.js');
  const { crearEventosSonido } = await import('../editar/edicion-dinamica/sonidos/crear-eventos-sonido.service.js');
  const { obtenerConfigSonidosEdicion } = await import('../editar/edicion-dinamica/sonidos/sonidos.config.js');
  const { crearReporteFinalEdicion } = await import('../salida/reporte-final/reporte-final.service.js');

  const plan = crearPlanPrueba();
  const puente = construirInstruccionesEdicionDesdePlan(plan);
  exigir(puente.ok && puente.instrucciones.length >= 8, 'Puente plan-edición no generó instrucciones suficientes.');
  exigir(puente.eventosVisualesPlan.length >= 5, 'Puente no generó visuales suficientes.');
  exigir(puente.eventosSonidoPlan.length >= 2, 'Puente no generó SFX suficientes.');

  const visuales = generarEventosVisualesDinamicos({ edicionDinamica: { activo: true, omitido: false, mapaTiempo: puente.mapaTiempo, puentePlanEdicion: puente, eventosVisualesPlan: puente.eventosVisualesPlan }, transcripcion: { textosFlotantes: { textos: [{ inicio: 20, fin: 22, texto: 'Texto automático' }] } }, opciones: { perfil: '11-contra-11', eventosVisualesPlan: puente.eventosVisualesPlan, instruccionesEdicionPlan: puente.instrucciones } });
  exigir(visuales.ok && !visuales.omitido && visuales.planVisual.total >= 5, 'Visuales desde plan no quedaron funcionales.');

  const animaciones = generarAnimacionesFfmpeg({ eventos: visuales.eventos, duracionSegundos: 48, width: 1080, height: 1920, opciones: { perfil: '11-contra-11' } });
  exigir(animaciones.ok && !animaciones.omitido && animaciones.filtrosMovimiento.length >= 1 && animaciones.filtrosOverlay.length >= 1, 'Animaciones FFmpeg no generaron filtros completos.');

  const configSonidos = obtenerConfigSonidosEdicion({ cantidadMaximaSonidos: 12, inicioSeguroSonidos: 0.5, separacionMinimaSonidos: 0.8 });
  const sonidos = crearEventosSonido({ visualDinamico: { omitido: false, eventosVisuales: visuales.eventos }, edicionDinamica: { activo: true, puentePlanEdicion: puente, eventosSonidoPlan: puente.eventosSonidoPlan, instruccionesEdicion: puente.instrucciones }, config: configSonidos, opciones: { eventosSonidoPlan: puente.eventosSonidoPlan, instruccionesEdicionPlan: puente.instrucciones } });
  exigir(sonidos.ok && !sonidos.omitido && sonidos.eventosPlanAplicados >= 1, 'SFX desde plan no quedaron funcionales.');

  const edicion = { ok: true, visualDinamico: { ok: true, omitido: false, eventosVisuales: visuales.eventos, visualesDesdePlan: visuales.planVisual, animacionesRender: animaciones }, sonidos: { ok: true, omitido: false, eventosSonido: sonidos.eventos, eventosSonidoPlan: sonidos.eventosPlan, resumenPlanSonido: { total: sonidos.eventosPlan.length, aplicados: sonidos.eventosPlanAplicados, omitidos: 0 } }, render: { filtroVideo: 'scale=1080:1920' }, salida: { nombreExportado: 'check.mp4' } };
  const salida = { ok: true, nombreExportado: 'check.mp4', urlPublica: '/exports/check.mp4', ffmpeg: { fallbackVisualUsado: false }, audio: { tipo: 'seguro' }, render: { planAudio: null } };
  const edicionDinamica = { activo: true, omitido: false, puentePlanEdicion: puente, instruccionesEdicion: puente.instrucciones, eventosVisualesPlan: puente.eventosVisualesPlan, eventosSonidoPlan: puente.eventosSonidoPlan, eventosTextoPlan: puente.eventosTextoPlan, mapaTiempo: puente.mapaTiempo };

  const timeline = construirTimelineEditorialProduccion({ plan, edicion, salida, videoBase: { multivideoActivo: false, videosFuente: [{ id: 'video-1' }] }, edicionDinamica });
  exigir(timeline.ok && timeline.marcadores.length >= 10, 'Timeline editorial no generó marcadores suficientes.');
  exigir(timeline.pistas.some((p) => p.id === 'audio-sfx') && timeline.pistas.some((p) => p.id === 'zooms'), 'Timeline no tiene pistas principales.');

  const carpetaProyecto = path.join(os.tmpdir(), 'autovideojeff-check-produccion-editorial');
  fs.rmSync(carpetaProyecto, { recursive: true, force: true });
  fs.mkdirSync(carpetaProyecto, { recursive: true });
  const reporte = await crearReporteFinalEdicion({ entrada: { proyecto: { id: 'check-produccion-editorial', perfil: '11-contra-11' }, rutas: { carpetaProyecto }, video: { nombreOriginal: 'check.mp4', rutaOriginal: 'check.mp4' } }, entendimiento: { analisis: { duracionSegundos: 48 }, fotogramas: { fotogramas: [] } }, audio: null, transcripcion: { textosFlotantes: { textos: [{ texto: 'Texto automático', inicio: 20, fin: 22 }] } }, edicionDinamica, edicion, salida, opciones: { perfil: '11-contra-11', plataforma: 'tiktok' } });
  exigir(reporte.ok && reporte.reporte?.auditoriaEdicionFinal?.ok && reporte.reporte?.trazabilidadPlan?.planEjecutableDetectado, 'Reporte final no generó auditoría válida.');
  fs.rmSync(carpetaProyecto, { recursive: true, force: true });

  return { instrucciones: puente.instrucciones.length, visuales: visuales.eventos.length, animaciones: animaciones.eventos.length, sfx: sonidos.eventos.length, marcadores: timeline.marcadores.length, pistas: timeline.pistas.length };
}

async function main() {
  verificarPackage();
  verificarConexionesEstaticas();
  verificarErroresBasicos();
  const resumen = await verificarFlujoFuncional();
  console.log(`OK Corrección producción editorial: ${resumen.instrucciones} instrucciones, ${resumen.visuales} visuales, ${resumen.animaciones} animaciones, ${resumen.sfx} SFX, ${resumen.marcadores} marcadores, ${resumen.pistas} pistas.`);
}

main().catch((error) => {
  console.error('ERROR Corrección producción editorial:', error.message);
  process.exit(1);
});
