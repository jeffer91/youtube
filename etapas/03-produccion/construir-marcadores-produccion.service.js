/*
  Bloque 1 - Timeline editorial de Produccion
  Funcion: convertir el plan aprobado, la edicion y la salida en marcadores visibles para Produccion.
*/

export const VERSION_TIMELINE_EDITORIAL = '1.0.0';

const PISTAS = Object.freeze([
  { id: 'global', nombre: 'Global' },
  { id: 'cortes', nombre: 'Cortes' },
  { id: 'subtitulos', nombre: 'Subtitulos' },
  { id: 'textos', nombre: 'Textos' },
  { id: 'zooms', nombre: 'Zooms' },
  { id: 'efectos', nombre: 'Efectos' },
  { id: 'animaciones', nombre: 'Animaciones' },
  { id: 'transiciones', nombre: 'Transiciones' },
  { id: 'audio-sfx', nombre: 'Audio / SFX' },
  { id: 'recursos', nombre: 'Recursos' },
  { id: 'diagnostico', nombre: 'Diagnostico' },
  { id: 'otros', nombre: 'Otros' }
]);

function arr(valor) {
  return Array.isArray(valor) ? valor : [];
}

function texto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function limpiarTextoBusqueda(valor = '') {
  return texto(valor, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function textoItem(item = {}) {
  const datos = item.datos || {};
  return limpiarTextoBusqueda([
    item.tipo,
    item.accion,
    item.pista,
    item.nombre,
    item.titulo,
    item.descripcion,
    item.texto,
    item.textoPantalla,
    item.subtitulo,
    item.efecto,
    item.audio,
    item.sonido,
    item.transicion,
    item.recursoBiblioteca,
    datos.tipo,
    datos.accion,
    datos.pista,
    datos.nombre,
    datos.titulo,
    datos.descripcion,
    datos.motivo,
    datos.texto,
    datos.textoPantalla,
    datos.subtitulo,
    datos.efecto,
    datos.audio,
    datos.sonido,
    datos.transicion
  ].filter(Boolean).join(' '));
}

function contiene(item = {}, palabras = []) {
  const base = textoItem(item);
  return palabras.some((palabra) => base.includes(limpiarTextoBusqueda(palabra)));
}

function obtenerPlanEjecutable(plan = {}) {
  return plan.planEjecutable || plan.planPorPartes?.planEjecutable || plan.planProduccion?.planEjecutable || null;
}

function obtenerAccionesEjecutables(plan = {}) {
  return arr(obtenerPlanEjecutable(plan)?.timeline);
}

function obtenerInicio(item = {}) {
  const datos = item.datos || {};
  return numero(
    item.inicioGlobal ?? item.startGlobal ?? item.inicio ?? item.start ?? item.segundo ?? datos.inicioGlobal ?? datos.startGlobal ?? datos.inicio ?? datos.start ?? datos.segundo,
    0
  );
}

function obtenerFin(item = {}, inicio = 0) {
  const datos = item.datos || {};
  const fin = numero(
    item.finGlobal ?? item.endGlobal ?? item.fin ?? item.end ?? datos.finGlobal ?? datos.endGlobal ?? datos.fin ?? datos.end,
    inicio + numero(item.duracion ?? datos.duracion, 2)
  );
  return fin <= inicio ? inicio + 0.5 : fin;
}

function obtenerVideoId(item = {}) {
  const datos = item.datos || {};
  return item.videoId || item.idVideo || datos.videoId || datos.idVideo || null;
}

function esGlobal(item = {}, duracion = 0) {
  const datos = item.datos || {};
  const bandera = item.global ?? item.esGlobal ?? item.globalFlag ?? datos.global ?? datos.esGlobal ?? false;
  if (bandera === true) return true;
  if (contiene(item, ['global', 'todo el video', 'toda la produccion', 'linea global', 'tiempo global'])) return true;
  const inicio = obtenerInicio(item);
  const fin = obtenerFin(item, inicio);
  return duracion > 0 && inicio <= 0.15 && fin >= duracion * 0.92 && contiene(item, ['fondo', 'audio', 'musica', 'estilo', 'color', 'barra']);
}

function normalizarTipoMarcador(item = {}, fallback = 'otro') {
  const tipo = limpiarTextoBusqueda(item.tipo || item.accion || item.pista || fallback);
  if (['corte', 'cut', 'segmento', 'trim', 'recorte'].some((p) => tipo.includes(p)) || contiene(item, ['corte', 'cut', 'segmento', 'recorte'])) return 'corte';
  if (tipo.includes('subtitulo') || tipo.includes('caption') || texto(item.subtitulo, '')) return 'subtitulo';
  if (tipo.includes('texto') || tipo.includes('titulo') || tipo.includes('lower') || texto(item.textoPantalla, '')) return 'texto';
  if (tipo.includes('zoom') || contiene(item, ['zoom', 'punch-in', 'punch in', 'acercamiento'])) return 'zoom';
  if (tipo.includes('animacion') || tipo.includes('animation') || contiene(item, ['animacion', 'entrada', 'salida', 'call to action', 'lower third'])) return 'animacion';
  if (tipo.includes('transicion') || tipo.includes('transition') || texto(item.transicion, '') || contiene(item, ['transicion', 'transition', 'flash', 'riser visual'])) return 'transicion';
  if (tipo.includes('audio') || tipo.includes('sonido') || tipo.includes('sfx') || texto(item.audio, '') || texto(item.sonido, '') || contiene(item, ['sfx', 'pop', 'click', 'hit', 'whoosh', 'riser', 'sonido'])) return 'audio-sfx';
  if (tipo.includes('efecto') || tipo.includes('fx') || texto(item.efecto, '') || contiene(item, ['efecto', 'fx', 'glitch', 'flash', 'shake'])) return 'efecto';
  if (tipo.includes('recurso') || tipo.includes('imagen') || tipo.includes('grafico') || tipo.includes('tabla') || item.recursoBiblioteca || item.biblioteca?.id) return 'recurso';
  if (tipo.includes('diagnostico') || tipo.includes('fallback') || tipo.includes('error')) return 'diagnostico';
  return fallback || 'otro';
}

function pistaPorTipo(tipo = 'otro', global = false) {
  if (global) return 'global';
  if (tipo === 'corte') return 'cortes';
  if (tipo === 'subtitulo') return 'subtitulos';
  if (tipo === 'texto') return 'textos';
  if (tipo === 'zoom') return 'zooms';
  if (tipo === 'efecto') return 'efectos';
  if (tipo === 'animacion') return 'animaciones';
  if (tipo === 'transicion') return 'transiciones';
  if (tipo === 'audio-sfx') return 'audio-sfx';
  if (tipo === 'recurso') return 'recursos';
  if (tipo === 'diagnostico') return 'diagnostico';
  return 'otros';
}

function obtenerNombre(item = {}, tipo = 'otro') {
  return texto(
    item.nombre || item.titulo || item.accion || item.textoPantalla || item.subtitulo || item.efecto || item.audio || item.sonido || item.transicion || item.recursoBiblioteca,
    tipo === 'audio-sfx' ? 'Audio / SFX' : tipo === 'zoom' ? 'Zoom editorial' : tipo === 'corte' ? 'Corte editorial' : 'Marcador editorial'
  );
}

function crearMarcador({ item = {}, index = 0, origen = 'plan', fuente = 'plan', fallbackTipo = 'otro', estado = 'planificado', duracionTotal = 0, aplicado = false } = {}) {
  const inicio = obtenerInicio(item);
  const fin = obtenerFin(item, inicio);
  const tipo = normalizarTipoMarcador(item, fallbackTipo);
  const global = esGlobal(item, duracionTotal);
  const pista = pistaPorTipo(tipo, global);
  const nombre = obtenerNombre(item, tipo);
  return {
    id: `marcador-${String(index + 1).padStart(4, '0')}`,
    orden: index + 1,
    tipo,
    pista,
    nombre,
    descripcion: texto(item.descripcion || item.motivo || item.reason || item.datos?.motivo, ''),
    inicio: Number(inicio.toFixed(3)),
    fin: Number(fin.toFixed(3)),
    duracion: Number(Math.max(0, fin - inicio).toFixed(3)),
    global,
    videoId: obtenerVideoId(item),
    origen,
    fuente,
    estado,
    aplicado: Boolean(aplicado),
    recurso: item.recurso || item.recursoBiblioteca || item.biblioteca?.id || item.datos?.recursoBiblioteca || null,
    datos: item
  };
}

function marcadoresDesdePlanProduccion(plan = {}, duracionTotal = 0) {
  const elementos = arr(plan.planProduccion?.elementos);
  return elementos.map((item, index) => crearMarcador({
    item,
    index,
    origen: 'plan-produccion',
    fuente: 'planProduccion.elementos',
    fallbackTipo: item.tipo || 'otro',
    estado: 'enviado_a_edicion',
    duracionTotal,
    aplicado: false
  }));
}

function marcadoresDesdePlanEjecutable(plan = {}, duracionTotal = 0) {
  return obtenerAccionesEjecutables(plan).map((item, index) => crearMarcador({
    item,
    index,
    origen: 'plan-gemini',
    fuente: 'planEjecutable.timeline',
    fallbackTipo: item.tipo || item.accion || 'otro',
    estado: 'planificado',
    duracionTotal,
    aplicado: false
  }));
}

function marcadoresDesdeEdicionDinamica(edicionDinamica = {}, duracionTotal = 0) {
  return arr(edicionDinamica.mapaTiempo).map((item, index) => crearMarcador({
    item,
    index,
    origen: 'edicion-dinamica',
    fuente: 'edicionDinamica.mapaTiempo',
    fallbackTipo: item.tipo || 'corte',
    estado: 'preparado',
    duracionTotal,
    aplicado: false
  }));
}

function marcadoresDesdeVisualDinamico(edicion = {}, duracionTotal = 0) {
  const visual = edicion.visualDinamico || {};
  const eventosVisuales = arr(visual.eventosVisuales).map((item, index) => crearMarcador({
    item,
    index,
    origen: 'visual-dinamico',
    fuente: 'edicion.visualDinamico.eventosVisuales',
    fallbackTipo: item.tipo || 'efecto',
    estado: visual.omitido ? 'omitido' : 'aplicado',
    duracionTotal,
    aplicado: !visual.omitido
  }));

  const animaciones = arr(visual.animacionesRender?.animaciones || visual.animacionesRender?.eventos).map((item, index) => crearMarcador({
    item,
    index,
    origen: 'animaciones-render',
    fuente: 'edicion.visualDinamico.animacionesRender',
    fallbackTipo: item.tipo || 'animacion',
    estado: visual.animacionesRender?.omitido ? 'omitido' : 'aplicado',
    duracionTotal,
    aplicado: !visual.animacionesRender?.omitido
  }));

  const diagnostico = [];
  if (visual.motorEfectos && !visual.motorEfectos.omitido) {
    diagnostico.push(crearMarcador({
      item: {
        tipo: 'efecto',
        inicio: 0,
        fin: Math.min(duracionTotal || 1, 1),
        nombre: 'Motor de efectos aplicado',
        descripcion: `${visual.motorEfectos.filtrosAplicados || 0} filtro(s) visual(es) aplicados.`
      },
      index: 0,
      origen: 'motor-efectos',
      fuente: 'edicion.visualDinamico.motorEfectos',
      fallbackTipo: 'efecto',
      estado: 'aplicado',
      duracionTotal,
      aplicado: true
    }));
  }

  return [...eventosVisuales, ...animaciones, ...diagnostico];
}

function marcadoresDesdeSonidos(edicion = {}, duracionTotal = 0) {
  const sonidos = edicion.sonidos || {};
  return arr(sonidos.eventosSonido).map((item, index) => crearMarcador({
    item: {
      ...item,
      tipo: item.tipo || item.sonido || 'audio-sfx',
      nombre: item.nombre || item.sonido || item.tipo || 'SFX editorial'
    },
    index,
    origen: 'sonidos-edicion',
    fuente: 'edicion.sonidos.eventosSonido',
    fallbackTipo: 'audio-sfx',
    estado: sonidos.omitido ? 'omitido' : 'aplicado',
    duracionTotal,
    aplicado: !sonidos.omitido
  }));
}

function marcadoresDiagnosticoSalida(salida = {}, duracionTotal = 0) {
  const marcadores = [];
  if (salida?.ffmpeg?.fallbackVisualUsado) {
    marcadores.push(crearMarcador({
      item: {
        tipo: 'diagnostico',
        inicio: 0,
        fin: Math.min(duracionTotal || 1, 1),
        nombre: 'Fallback visual usado',
        descripcion: salida.ffmpeg.errorFiltroPrincipal || 'Se exporto con filtro visual seguro.'
      },
      index: 0,
      origen: 'salida-ffmpeg',
      fuente: 'salida.ffmpeg',
      fallbackTipo: 'diagnostico',
      estado: 'fallback',
      duracionTotal,
      aplicado: true
    }));
  }
  return marcadores;
}

function calcularDuracionTotal({ plan = {}, edicion = {}, salida = {}, edicionDinamica = {} } = {}) {
  const candidatos = [
    plan.resumen?.duracionTotalSegundos,
    plan.planProduccion?.duracionSegundos,
    edicion.entrada?.medidasOriginales?.duracionSegundos,
    edicion.entrada?.duracionSegundos,
    salida.entendimiento?.duracionSegundos,
    edicionDinamica.mapaTiempo?.duracionEditada,
    edicionDinamica.cortes?.resumen?.duracionEditada
  ];
  const rangos = [
    ...arr(plan.planProduccion?.elementos),
    ...obtenerAccionesEjecutables(plan),
    ...arr(edicionDinamica.mapaTiempo),
    ...arr(edicion.visualDinamico?.eventosVisuales),
    ...arr(edicion.visualDinamico?.animacionesRender?.animaciones),
    ...arr(edicion.sonidos?.eventosSonido)
  ].map((item) => obtenerFin(item, obtenerInicio(item)));
  return Math.max(30, ...candidatos.map((item) => numero(item, 0)), ...rangos.map((item) => numero(item, 0)));
}

function claveMarcador(marcador = {}) {
  return [marcador.pista, marcador.tipo, marcador.inicio.toFixed(2), marcador.fin.toFixed(2), limpiarTextoBusqueda(marcador.nombre)].join('|');
}

function deduplicarMarcadores(marcadores = []) {
  const mapa = new Map();
  for (const marcador of marcadores) {
    const clave = claveMarcador(marcador);
    const previo = mapa.get(clave);
    if (!previo) {
      mapa.set(clave, marcador);
      continue;
    }
    const aplicado = previo.aplicado || marcador.aplicado;
    mapa.set(clave, {
      ...previo,
      aplicado,
      estado: aplicado ? 'aplicado' : previo.estado,
      origen: [...new Set([previo.origen, marcador.origen].filter(Boolean))].join(' + '),
      fuente: [...new Set([previo.fuente, marcador.fuente].filter(Boolean))].join(' + ')
    });
  }
  return [...mapa.values()];
}

function reordenarMarcadores(marcadores = []) {
  return marcadores
    .sort((a, b) => a.inicio - b.inicio || a.fin - b.fin || a.pista.localeCompare(b.pista))
    .map((item, index) => ({ ...item, id: `marcador-${String(index + 1).padStart(4, '0')}`, orden: index + 1 }));
}

function agruparPistas(marcadores = []) {
  return PISTAS.map((pista) => ({
    ...pista,
    total: marcadores.filter((item) => item.pista === pista.id).length,
    marcadores: marcadores.filter((item) => item.pista === pista.id)
  })).filter((pista) => pista.total > 0);
}

function contarPorCampo(marcadores = [], campo = 'tipo') {
  return marcadores.reduce((acc, item) => {
    const clave = item[campo] || 'otro';
    acc[clave] = (acc[clave] || 0) + 1;
    return acc;
  }, {});
}

function crearResumen(marcadores = [], pistas = [], duracionSegundos = 0) {
  const porTipo = contarPorCampo(marcadores, 'tipo');
  const porPista = contarPorCampo(marcadores, 'pista');
  return {
    ok: true,
    totalMarcadores: marcadores.length,
    totalPistas: pistas.length,
    duracionSegundos,
    aplicados: marcadores.filter((item) => item.aplicado || item.estado === 'aplicado').length,
    planificados: marcadores.filter((item) => item.estado === 'planificado' || item.estado === 'enviado_a_edicion' || item.estado === 'preparado').length,
    omitidos: marcadores.filter((item) => item.estado === 'omitido').length,
    globales: marcadores.filter((item) => item.global || item.pista === 'global').length,
    cortes: porTipo.corte || 0,
    subtitulos: porTipo.subtitulo || 0,
    textos: porTipo.texto || 0,
    zooms: porTipo.zoom || 0,
    efectos: porTipo.efecto || 0,
    animaciones: porTipo.animacion || 0,
    transiciones: porTipo.transicion || 0,
    audioSfx: porTipo['audio-sfx'] || 0,
    recursos: porTipo.recurso || 0,
    diagnostico: porTipo.diagnostico || 0,
    porTipo,
    porPista
  };
}

export function construirTimelineEditorialProduccion({ plan = {}, edicion = {}, salida = {}, videoBase = {}, edicionDinamica = {} } = {}) {
  const duracionSegundos = calcularDuracionTotal({ plan, edicion, salida, edicionDinamica });
  const marcadoresBase = [
    ...marcadoresDesdePlanProduccion(plan, duracionSegundos),
    ...marcadoresDesdePlanEjecutable(plan, duracionSegundos),
    ...marcadoresDesdeEdicionDinamica(edicionDinamica, duracionSegundos),
    ...marcadoresDesdeVisualDinamico(edicion, duracionSegundos),
    ...marcadoresDesdeSonidos(edicion, duracionSegundos),
    ...marcadoresDiagnosticoSalida(salida, duracionSegundos)
  ];
  const marcadores = reordenarMarcadores(deduplicarMarcadores(marcadoresBase));
  const pistas = agruparPistas(marcadores);
  const resumen = crearResumen(marcadores, pistas, duracionSegundos);

  return {
    ok: true,
    tipo: 'timeline-editorial-produccion',
    version: VERSION_TIMELINE_EDITORIAL,
    proyectoId: plan.proyecto?.id || plan.proyectoId || null,
    multivideo: {
      activo: Boolean(videoBase?.multivideoActivo),
      videosFuente: videoBase?.videosFuente?.length || 1,
      usaVideoMaestroUnido: Boolean(videoBase?.unionVideos?.videoMaestro)
    },
    duracionSegundos,
    resumen,
    pistas,
    marcadores,
    fuentes: {
      planProduccion: arr(plan.planProduccion?.elementos).length,
      planEjecutable: obtenerAccionesEjecutables(plan).length,
      edicionDinamica: arr(edicionDinamica.mapaTiempo).length,
      visualesAplicados: arr(edicion.visualDinamico?.eventosVisuales).length,
      animacionesAplicadas: arr(edicion.visualDinamico?.animacionesRender?.animaciones || edicion.visualDinamico?.animacionesRender?.eventos).length,
      sonidosAplicados: arr(edicion.sonidos?.eventosSonido).length
    },
    creadoEn: new Date().toISOString()
  };
}

export default construirTimelineEditorialProduccion;
