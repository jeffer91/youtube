/*
  Bloque 3 - Plan Gemini -> Edicion real
  Funcion: convertir el JSON tecnico ejecutable del plan en instrucciones normalizadas para los motores de edicion.
*/

export const VERSION_PUENTE_PLAN_EDICION = '1.0.0';

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

function limpiar(valor = '') {
  return texto(valor, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function obtenerPlanEjecutable(plan = {}) {
  return plan.planEjecutable || plan.planPorPartes?.planEjecutable || plan.planProduccion?.planEjecutable || null;
}

function obtenerAccionesEjecutables(plan = {}) {
  return arr(obtenerPlanEjecutable(plan)?.timeline);
}

function obtenerElementosPlan(plan = {}) {
  return arr(plan.planProduccion?.elementos);
}

function textoAccion(item = {}) {
  return limpiar([
    item.tipo,
    item.accion,
    item.pista,
    item.nombre,
    item.titulo,
    item.texto,
    item.textoPantalla,
    item.subtitulo,
    item.efecto,
    item.audio,
    item.sonido,
    item.transicion,
    item.motivo,
    item.descripcion
  ].filter(Boolean).join(' '));
}

function contiene(item = {}, palabras = []) {
  const base = textoAccion(item);
  return palabras.some((palabra) => base.includes(limpiar(palabra)));
}

function normalizarTipoAccion(item = {}) {
  const tipo = limpiar(item.tipo || item.accion || item.pista || 'accion_edicion');
  if (['corte', 'segmento', 'recorte', 'cut', 'trim'].some((p) => tipo.includes(p)) || contiene(item, ['corte', 'recorte', 'segmento'])) return 'corte';
  if (tipo.includes('subtitulo') || tipo.includes('caption') || texto(item.subtitulo, '')) return 'subtitulo';
  if (tipo.includes('texto') || tipo.includes('titulo') || tipo.includes('lower') || texto(item.textoPantalla, '')) return 'texto';
  if (tipo.includes('zoom') || contiene(item, ['zoom', 'punch', 'acercamiento'])) return 'zoom';
  if (tipo.includes('animacion') || tipo.includes('animation') || contiene(item, ['animacion', 'entrada', 'salida', 'call to action', 'lower third'])) return 'animacion';
  if (tipo.includes('transicion') || tipo.includes('transition') || texto(item.transicion, '') || contiene(item, ['transicion', 'flash', 'cambio de escena'])) return 'transicion';
  if (tipo.includes('audio') || tipo.includes('sonido') || tipo.includes('sfx') || texto(item.audio, '') || texto(item.sonido, '') || contiene(item, ['sfx', 'whoosh', 'pop', 'hit', 'click', 'riser'])) return 'audio-sfx';
  if (tipo.includes('efecto') || tipo.includes('fx') || texto(item.efecto, '') || contiene(item, ['efecto', 'glitch', 'shake', 'flash'])) return 'efecto';
  if (tipo.includes('recurso') || tipo.includes('imagen') || tipo.includes('grafico') || item.recursoBiblioteca) return 'recurso';
  return 'otro';
}

function obtenerInicio(item = {}, index = 0) {
  return Math.max(0, numero(item.inicio ?? item.start ?? item.segundo ?? item.inicioGlobal ?? item.datos?.inicio ?? item.datos?.inicioGlobal, index * 2));
}

function obtenerFin(item = {}, inicio = 0) {
  const fin = numero(item.fin ?? item.end ?? item.finGlobal ?? item.datos?.fin ?? item.datos?.finGlobal, inicio + numero(item.duracion ?? item.datos?.duracion, 2.5));
  return fin <= inicio ? inicio + 0.5 : fin;
}

function esGlobal(item = {}, duracionTotal = 0) {
  if (item.global === true || item.esGlobal === true || item.datos?.global === true) return true;
  if (contiene(item, ['global', 'todo el video', 'toda la produccion', 'fondo musical', 'estilo general'])) return true;
  const inicio = obtenerInicio(item);
  const fin = obtenerFin(item, inicio);
  return duracionTotal > 0 && inicio <= 0.15 && fin >= duracionTotal * 0.92 && contiene(item, ['musica', 'barra', 'color', 'estilo', 'fondo']);
}

function obtenerNombre(item = {}, tipo = 'otro') {
  return texto(
    item.nombre || item.titulo || item.accion || item.textoPantalla || item.subtitulo || item.efecto || item.transicion || item.audio || item.sonido || item.recursoBiblioteca,
    tipo === 'zoom' ? 'Zoom desde plan' : tipo === 'audio-sfx' ? 'SFX desde plan' : tipo === 'corte' ? 'Corte desde plan' : 'Instruccion desde plan'
  );
}

function calcularDuracionPlan(plan = {}) {
  const rangos = [
    ...obtenerElementosPlan(plan),
    ...obtenerAccionesEjecutables(plan)
  ].map((item, index) => obtenerFin(item, obtenerInicio(item, index)));
  return Math.max(30, numero(plan.resumen?.duracionTotalSegundos, 0), numero(plan.planProduccion?.duracionSegundos, 0), ...rangos);
}

function normalizarAccion(item = {}, index = 0, { origen = 'plan-ejecutable', fuente = 'planEjecutable.timeline', duracionTotal = 0 } = {}) {
  const inicio = obtenerInicio(item, index);
  const fin = obtenerFin(item, inicio);
  const tipo = normalizarTipoAccion(item);
  return {
    id: texto(item.id, `instruccion-${index + 1}`),
    orden: index + 1,
    tipo,
    accionOriginal: texto(item.accion || item.tipo || item.pista, tipo),
    pista: texto(item.pista || item.track, tipo),
    nombre: obtenerNombre(item, tipo),
    inicio: Number(inicio.toFixed(3)),
    fin: Number(fin.toFixed(3)),
    duracion: Number(Math.max(0.2, fin - inicio).toFixed(3)),
    global: esGlobal(item, duracionTotal),
    prioridad: numero(item.prioridad, index + 1),
    videoId: item.videoId || item.idVideo || item.datos?.videoId || null,
    textoPantalla: texto(item.textoPantalla || item.texto || item.titulo || item.nombre, ''),
    subtitulo: texto(item.subtitulo || item.caption, ''),
    efecto: texto(item.efecto || item.fx || (tipo === 'efecto' || tipo === 'zoom' ? item.nombre : ''), ''),
    audio: texto(item.audio || item.sonido || (tipo === 'audio-sfx' ? item.nombre : ''), ''),
    transicion: texto(item.transicion || item.transition || (tipo === 'transicion' ? item.nombre : ''), ''),
    recursoBiblioteca: item.recursoBiblioteca || item.biblioteca?.id || item.recurso?.id || item.datos?.recursoBiblioteca || null,
    motivo: texto(item.motivo || item.descripcion || item.reason, 'Instruccion tomada del plan aprobado.'),
    origen,
    fuente,
    estado: 'normalizada',
    aplicable: true,
    datos: item
  };
}

function accionesDesdeElementos(plan = {}, duracionTotal = 0) {
  return obtenerElementosPlan(plan).map((item, index) => normalizarAccion({
    ...item,
    accion: item.accion || item.tipo,
    textoPantalla: item.textoPantalla || item.datos?.texto || item.nombre,
    subtitulo: item.subtitulo || item.datos?.subtitulo,
    efecto: item.efecto || (['efecto', 'zoom'].includes(item.tipo) ? item.nombre : ''),
    audio: item.audio || (item.tipo === 'audio' ? item.nombre : ''),
    transicion: item.transicion || (item.tipo === 'transicion' ? item.nombre : '')
  }, index, { origen: 'plan-produccion', fuente: 'planProduccion.elementos', duracionTotal }));
}

function accionesDesdeEjecutable(plan = {}, duracionTotal = 0) {
  return obtenerAccionesEjecutables(plan).map((item, index) => normalizarAccion(item, index, { origen: 'plan-gemini', fuente: 'planEjecutable.timeline', duracionTotal }));
}

function deduplicarInstrucciones(instrucciones = []) {
  const mapa = new Map();
  for (const item of instrucciones) {
    const clave = [item.tipo, item.inicio.toFixed(2), item.fin.toFixed(2), limpiar(item.nombre)].join('|');
    const previo = mapa.get(clave);
    if (!previo) {
      mapa.set(clave, item);
      continue;
    }
    mapa.set(clave, {
      ...previo,
      origen: [...new Set([previo.origen, item.origen].filter(Boolean))].join(' + '),
      fuente: [...new Set([previo.fuente, item.fuente].filter(Boolean))].join(' + '),
      datos: { previo: previo.datos, actual: item.datos }
    });
  }
  return [...mapa.values()].sort((a, b) => a.inicio - b.inicio || a.prioridad - b.prioridad).map((item, index) => ({ ...item, orden: index + 1 }));
}

function crearMapaTiempo(instrucciones = []) {
  return instrucciones
    .filter((item) => ['corte', 'segmento', 'subtitulo', 'texto', 'efecto', 'recurso', 'zoom', 'animacion', 'transicion', 'audio-sfx'].includes(item.tipo))
    .map((item) => ({
      id: item.id,
      tipo: item.tipo,
      accionOriginal: item.accionOriginal,
      videoId: item.videoId,
      inicioGlobal: item.inicio,
      finGlobal: item.fin,
      inicio: item.inicio,
      fin: item.fin,
      duracion: item.duracion,
      global: item.global,
      motivo: item.motivo,
      origen: item.origen,
      datos: item
    }));
}

function crearEventosVisuales(instrucciones = []) {
  return instrucciones
    .filter((item) => ['zoom', 'efecto', 'animacion', 'transicion', 'texto'].includes(item.tipo))
    .map((item, index) => ({
      id: `visual-plan-${index + 1}`,
      tipo: item.tipo,
      inicio: item.inicio,
      fin: item.fin,
      texto: item.textoPantalla || item.efecto || item.transicion || item.nombre,
      efecto: item.efecto || item.nombre,
      transicion: item.transicion,
      intensidad: item.tipo === 'zoom' ? 1.045 : undefined,
      prioridad: item.prioridad,
      motivo: item.motivo,
      origen: item.origen,
      datos: item
    }));
}

function crearEventosSonido(instrucciones = []) {
  return instrucciones
    .filter((item) => item.tipo === 'audio-sfx')
    .map((item, index) => ({
      id: `sonido-plan-${index + 1}`,
      tipo: item.audio || item.nombre || 'sfx',
      sonido: item.audio || item.nombre || 'sfx',
      inicio: item.inicio,
      fin: item.fin,
      volumen: 0.22,
      motivo: item.motivo,
      origen: item.origen,
      datos: item
    }));
}

function crearEventosTexto(instrucciones = []) {
  return instrucciones
    .filter((item) => ['texto', 'subtitulo'].includes(item.tipo) && (item.textoPantalla || item.subtitulo || item.nombre))
    .map((item, index) => ({
      id: `texto-plan-${index + 1}`,
      tipo: item.tipo,
      inicio: item.inicio,
      fin: item.fin,
      texto: item.textoPantalla || item.subtitulo || item.nombre,
      motivo: item.motivo,
      origen: item.origen,
      datos: item
    }));
}

function contarPorTipo(instrucciones = []) {
  return instrucciones.reduce((acc, item) => {
    acc[item.tipo] = (acc[item.tipo] || 0) + 1;
    return acc;
  }, {});
}

export function construirInstruccionesEdicionDesdePlan(plan = {}) {
  const duracionTotal = calcularDuracionPlan(plan);
  const planEjecutable = obtenerPlanEjecutable(plan);
  const desdeEjecutable = accionesDesdeEjecutable(plan, duracionTotal);
  const desdeElementos = accionesDesdeElementos(plan, duracionTotal);
  const instrucciones = deduplicarInstrucciones([...(desdeEjecutable.length ? desdeEjecutable : []), ...desdeElementos]);
  const mapaTiempo = crearMapaTiempo(instrucciones);
  const eventosVisualesPlan = crearEventosVisuales(instrucciones);
  const eventosSonidoPlan = crearEventosSonido(instrucciones);
  const eventosTextoPlan = crearEventosTexto(instrucciones);
  const porTipo = contarPorTipo(instrucciones);

  return {
    ok: instrucciones.length > 0,
    tipo: 'puente-plan-ejecutable-edicion',
    version: VERSION_PUENTE_PLAN_EDICION,
    proveedor: planEjecutable?.proveedor || plan.planPorPartes?.resumen?.mejorProveedor || plan.planPorPartes?.resumen?.proveedorPrincipal || 'desconocido',
    planEjecutable,
    totalAccionesPlanEjecutable: desdeEjecutable.length,
    totalElementosPlan: desdeElementos.length,
    duracionTotal,
    instrucciones,
    mapaTiempo,
    eventosVisualesPlan,
    eventosSonidoPlan,
    eventosTextoPlan,
    globales: instrucciones.filter((item) => item.global),
    resumen: {
      totalInstrucciones: instrucciones.length,
      mapaTiempo: mapaTiempo.length,
      visuales: eventosVisualesPlan.length,
      sonidos: eventosSonidoPlan.length,
      textos: eventosTextoPlan.length,
      globales: instrucciones.filter((item) => item.global).length,
      cortes: porTipo.corte || 0,
      subtitulos: porTipo.subtitulo || 0,
      zooms: porTipo.zoom || 0,
      efectos: porTipo.efecto || 0,
      animaciones: porTipo.animacion || 0,
      transiciones: porTipo.transicion || 0,
      audioSfx: porTipo['audio-sfx'] || 0,
      recursos: porTipo.recurso || 0,
      porTipo
    },
    diagnostico: {
      fuentePrincipal: desdeEjecutable.length ? 'planEjecutable.timeline' : 'planProduccion.elementos',
      mensaje: instrucciones.length
        ? 'Plan aprobado convertido en instrucciones normalizadas para edicion.'
        : 'No se encontraron instrucciones aplicables en el plan aprobado.'
    },
    creadoEn: new Date().toISOString()
  };
}

export default construirInstruccionesEdicionDesdePlan;
