import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  return fs.readFileSync(ruta, 'utf-8');
}

function contiene(ruta, claves) {
  const contenido = leer(ruta);
  for (const clave of claves) exigir(contenido.includes(clave), `${ruta} no contiene ${clave}`);
}

function crearPlanSintetico() {
  return {
    proyecto: { id: 'proyecto-prueba', perfil: '11-contra-11', plataforma: 'tiktok' },
    resumen: { duracionTotalSegundos: 42 },
    planEjecutable: {
      proveedor: 'gemini-prueba',
      timeline: [
        { id: 'corte-1', tipo: 'corte', accion: 'corte', inicio: 0.8, fin: 7.4, motivo: 'Abrir con gancho.' },
        { id: 'zoom-1', tipo: 'zoom', accion: 'zoom de enfasis', inicio: 8.0, fin: 10.2, texto: 'Ojo a esto', motivo: 'Momento clave.' },
        { id: 'efecto-1', tipo: 'efecto', accion: 'shake suave', efecto: 'shake suave', inicio: 12.0, fin: 13.0, motivo: 'Golpe visual.' },
        { id: 'animacion-1', tipo: 'animacion', accion: 'lower third', textoPantalla: 'Dato clave', inicio: 14.0, fin: 16.5, motivo: 'Explicar contexto.' },
        { id: 'transicion-1', tipo: 'transicion', accion: 'flash blanco', transicion: 'flash blanco', inicio: 18.0, fin: 18.6, motivo: 'Cambio de bloque.' },
        { id: 'sfx-1', tipo: 'audio-sfx', accion: 'whoosh', sonido: 'whoosh', inicio: 18.0, fin: 18.3, motivo: 'Refuerzo de transición.' },
        { id: 'sfx-2', tipo: 'audio-sfx', accion: 'hit', sonido: 'hit', inicio: 24.0, fin: 24.2, motivo: 'Énfasis.' },
        { id: 'global-1', tipo: 'audio-sfx', accion: 'musica de fondo global', audio: 'musica de fondo', inicio: 0, fin: 42, global: true, motivo: 'Debe tratarse separado de SFX.' }
      ]
    },
    planProduccion: {
      id: 'plan-produccion-prueba',
      duracionSegundos: 42,
      elementos: [
        { id: 'texto-plan', tipo: 'texto', inicio: 5.0, fin: 7.0, nombre: 'Texto de apoyo', descripcion: 'Texto del plan.' },
        { id: 'zoom-plan', tipo: 'zoom', inicio: 8.0, fin: 10.2, nombre: 'Zoom de énfasis', descripcion: 'Zoom del plan.' }
      ]
    }
  };
}

function crearEdicionSintetica(puente) {
  return {
    ok: true,
    visualDinamico: {
      ok: true,
      omitido: false,
      eventosVisuales: puente.eventosVisualesPlan,
      visualesDesdePlan: { total: puente.eventosVisualesPlan.length, zooms: 1, efectos: 1, animaciones: 1, transiciones: 1, textos: 1 },
      animacionesRender: {
        ok: true,
        omitido: false,
        total: puente.eventosVisualesPlan.length,
        eventos: puente.eventosVisualesPlan.map((item, index) => ({ ...item, id: `anim-render-${index + 1}`, desdePlan: true, origen: 'plan-ejecutable-gemini' }))
      }
    },
    sonidos: {
      ok: true,
      omitido: false,
      eventosSonido: puente.eventosSonidoPlan.map((item, index) => ({ id: index + 1, sonido: item.sonido || item.audio || 'whoosh', tiempo: item.inicio, desdePlan: true, motivo: item.motivo })),
      eventosSonidoPlan: puente.eventosSonidoPlan,
      resumenPlanSonido: { total: puente.eventosSonidoPlan.length, aplicados: Math.max(0, puente.eventosSonidoPlan.length - 1), omitidos: 1, descartados: { musica: 1, invalidos: 0, total: 1 } }
    },
    render: { filtroVideo: 'scale=1080:1920', filtroVideoBase: 'scale=1080:1920' },
    salida: { nombreExportado: 'prueba.mp4' }
  };
}

function verificarArchivosClave() {
  contiene('etapas/03-produccion/construir-marcadores-produccion.service.js', [
    'construirTimelineEditorialProduccion',
    'marcadoresDesdePlanProduccion',
    'marcadoresDesdePlanEjecutable',
    'marcadoresDesdeVisualDinamico',
    'marcadoresDesdeSonidos',
    'resumen',
    'pistas',
    'marcadores'
  ]);

  contiene('etapas/03-produccion/aplicar-plan-ejecutable-edicion.service.js', [
    'construirInstruccionesEdicionDesdePlan',
    'eventosVisualesPlan',
    'eventosSonidoPlan',
    'eventosTextoPlan',
    'mapaTiempo',
    'globales'
  ]);

  contiene('etapas/03-produccion/procesar-produccion-maestro.service.js', [
    'construirTimelineEditorialProduccion',
    'construirInstruccionesEdicionDesdePlan',
    'puentePlanEdicion',
    'instruccionesEdicionPlan',
    'marcadoresProduccion',
    'resumenMarcadores',
    'edicionDinamica'
  ]);
}

function verificarUiProduccion() {
  contiene('app/pantallas/produccion.view.js', [
    'produccionMaestroMarcadores',
    'produccionMaestroGlobales',
    'produccionMaestroCortes',
    'produccionMaestroZooms',
    'produccionMaestroEfectos',
    'produccionMaestroAnimaciones',
    'produccionMaestroTransiciones',
    'produccionMaestroAudioSfx',
    'produccionMaestroTimelineResumen',
    'produccionMaestroTimelineLeyenda',
    'produccionMaestroMarcadorSeleccionado',
    'produccionMaestroFiltroPista',
    'produccionMaestroFiltroEstado',
    'produccionMaestroBuscarMarcador',
    'produccionMaestroLimpiarFiltrosBtn'
  ]);

  contiene('app/etapas-ui/produccion-maestro-ui.js', [
    'obtenerMarcadores',
    'obtenerPistas',
    'renderTimelineResumen',
    'renderTimelineLeyenda',
    'renderTimelineItem',
    'renderMarcadorSeleccionado',
    'timelineEditorial.marcadores',
    'marcadoresProduccion',
    'aplicarFiltrosMarcadores',
    'refrescarTimelineConFiltros',
    'limpiarFiltrosTimeline'
  ]);
}

function verificarSincronizacionPreview() {
  contiene('app/etapas-ui/produccion-maestro-ui.js', [
    'marcadorActivoId',
    'segmentoPreviewActivo',
    'obtenerMarcadorPorId',
    'marcarTimelineActivo',
    'sincronizarPreviewConMarcador',
    'manejarAccionMarcador',
    'actualizarMarcadorActivoPorTiempo',
    'data-marcador-action',
    'data-inicio',
    'data-fin',
    'currentTime',
    'video.play',
    'timeupdate',
    'produccionMaestroVideo'
  ]);

  contiene('app/produccion-editorial.css', [
    '.produccion-maestro-timeline-item.is-active',
    '.produccion-maestro-panel--preview.is-synced',
    '.produccion-maestro-marker-actions',
    'outline',
    'box-shadow'
  ]);
}

function verificarVisualesYAudio() {
  contiene('editar/edicion-dinamica/visual/generar-eventos-visuales.service.js', [
    'eventosVisualesPlan',
    'instruccionesEdicionPlan',
    'planVisual',
    'zoom-plan',
    'efecto-plan',
    'animacion-plan',
    'transicion-plan'
  ]);

  contiene('editar/edicion-dinamica/visual/generar-animaciones-ffmpeg.service.js', [
    'crearFiltroZoomsDesdePlan',
    'crearFiltroPulsoTextoPlan',
    'desdePlan',
    'zoomsPlan',
    'transicionesPlan',
    'animacionesPlan'
  ]);

  contiene('editar/edicion-dinamica/sonidos/crear-eventos-sonido.service.js', [
    'obtenerEventosSonidoPlan',
    'convertirPlanASonido',
    'eventosPlanAplicados',
    'descartadosPlan',
    'No hay eventos visuales ni eventos SFX del plan'
  ]);

  contiene('editar/edicion-dinamica/sonidos/sonidos.conexion.js', [
    'resumenPlanSonido',
    'eventosSonidoPlan',
    'SFX desde plan',
    'eventosPlanAplicados'
  ]);

  contiene('editar/edicion-dinamica/sonidos/sonidos.config.js', [
    'RISER',
    'NOTIFICATION',
    'BEEP',
    'riser',
    'notification',
    'beep'
  ]);
}

function verificarReporteFinal() {
  contiene('salida/reporte-final/reporte-final.service.js', [
    'trazabilidadPlan',
    'timelineEditorialAplicada',
    'auditoriaEdicionFinal',
    'sfxDesdePlanAplicados',
    'visualesDesdePlan',
    'omitidosControlados',
    'fallbackVisualUsado'
  ]);

  contiene('salida/exportar-simple/exportar.service.js', [
    'crearReporteFinalEdicion({ entrada, entendimiento, audio, transcripcion, edicionDinamica, edicion',
    'auditoría final de plan',
    'auditoriaPlan'
  ]);
}

async function verificarImportsYDatosSinteticos() {
  const { construirInstruccionesEdicionDesdePlan } = await import('../etapas/03-produccion/aplicar-plan-ejecutable-edicion.service.js');
  const { construirTimelineEditorialProduccion } = await import('../etapas/03-produccion/construir-marcadores-produccion.service.js');
  const { generarEventosVisualesDinamicos } = await import('../editar/edicion-dinamica/visual/generar-eventos-visuales.service.js');
  const { crearEventosSonido } = await import('../editar/edicion-dinamica/sonidos/crear-eventos-sonido.service.js');
  const { obtenerConfigSonidosEdicion } = await import('../editar/edicion-dinamica/sonidos/sonidos.config.js');

  const plan = crearPlanSintetico();
  const puente = construirInstruccionesEdicionDesdePlan(plan);
  exigir(puente.ok === true, 'El puente plan-edición no quedó activo con plan sintético.');
  exigir(puente.resumen.totalInstrucciones >= 7, 'El puente no detectó suficientes instrucciones.');
  exigir(puente.eventosVisualesPlan.length >= 4, 'El puente no generó eventos visuales del plan.');
  exigir(puente.eventosSonidoPlan.length >= 2, 'El puente no generó eventos SFX del plan.');
  exigir(puente.mapaTiempo.length >= 6, 'El puente no generó mapaTiempo suficiente.');

  const visuales = generarEventosVisualesDinamicos({
    edicionDinamica: { activo: true, omitido: false, mapaTiempo: puente.mapaTiempo, puentePlanEdicion: puente, eventosVisualesPlan: puente.eventosVisualesPlan },
    transcripcion: { textosFlotantes: { textos: [] } },
    opciones: { perfil: '11-contra-11', eventosVisualesPlan: puente.eventosVisualesPlan, instruccionesEdicionPlan: puente.instrucciones }
  });
  exigir(visuales.ok === true, 'Eventos visuales no respondió ok.');
  exigir(visuales.planVisual.total >= 4, 'Visuales no detectó eventos del plan.');
  exigir(visuales.planVisual.zooms >= 1, 'Visuales no detectó zoom del plan.');
  exigir(visuales.planVisual.transiciones >= 1, 'Visuales no detectó transición del plan.');

  const configSonidos = obtenerConfigSonidosEdicion({ cantidadMaximaSonidos: 12, inicioSeguroSonidos: 0.6, separacionMinimaSonidos: 0.8 });
  const sonidos = crearEventosSonido({
    visualDinamico: { omitido: false, eventosVisuales: visuales.eventos },
    edicionDinamica: { puentePlanEdicion: puente, eventosSonidoPlan: puente.eventosSonidoPlan },
    config: configSonidos,
    opciones: { instruccionesEdicionPlan: puente.instrucciones, eventosSonidoPlan: puente.eventosSonidoPlan }
  });
  exigir(sonidos.ok === true, 'Eventos de sonido no respondió ok.');
  exigir(sonidos.eventosPlan.length >= 2, 'Sonidos no detectó SFX del plan.');
  exigir(sonidos.eventosPlanAplicados >= 1, 'Sonidos no aplicó ningún SFX del plan.');

  const edicion = crearEdicionSintetica(puente);
  const timeline = construirTimelineEditorialProduccion({
    plan,
    edicion,
    salida: { ok: true, nombreExportado: 'prueba.mp4', ffmpeg: { fallbackVisualUsado: false } },
    videoBase: { multivideoActivo: false, videosFuente: [{ id: 'video-1' }] },
    edicionDinamica: { activo: true, omitido: false, mapaTiempo: puente.mapaTiempo, puentePlanEdicion: puente, eventosVisualesPlan: puente.eventosVisualesPlan, eventosSonidoPlan: puente.eventosSonidoPlan }
  });
  exigir(timeline.ok === true, 'Timeline editorial no respondió ok.');
  exigir(timeline.marcadores.length >= 8, 'Timeline editorial no generó suficientes marcadores.');
  exigir(timeline.resumen.zooms >= 1, 'Timeline editorial no contó zooms.');
  exigir(timeline.resumen.transiciones >= 1, 'Timeline editorial no contó transiciones.');
  exigir(timeline.resumen.audioSfx >= 1, 'Timeline editorial no contó audio/SFX.');
  exigir(timeline.pistas.some((pista) => pista.id === 'audio-sfx'), 'Timeline editorial no creó pista Audio/SFX.');

  return {
    instrucciones: puente.resumen.totalInstrucciones,
    visualesPlan: visuales.planVisual.total,
    sfxPlan: sonidos.eventosPlanAplicados,
    marcadores: timeline.marcadores.length,
    pistas: timeline.pistas.length
  };
}

async function main() {
  verificarArchivosClave();
  verificarUiProduccion();
  verificarSincronizacionPreview();
  verificarVisualesYAudio();
  verificarReporteFinal();
  const resumen = await verificarImportsYDatosSinteticos();
  console.log(`OK Producción editorial completa: ${resumen.instrucciones} instrucciones, ${resumen.visualesPlan} visual(es) plan, ${resumen.sfxPlan} SFX plan, ${resumen.marcadores} marcador(es), ${resumen.pistas} pista(s), preview sincronizado.`);
}

main().catch((error) => {
  console.error('ERROR Producción editorial:', error.message);
  process.exit(1);
});
