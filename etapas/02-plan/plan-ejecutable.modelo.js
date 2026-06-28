/*
  Bloque 6 - JSON tecnico ejecutable para Produccion
  Funcion: convertir el plan elegido por IA en instrucciones que Produccion pueda ejecutar.
*/

export const VERSION_PLAN_EJECUTABLE = '1.0.0';

function texto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function arr(valor) {
  return Array.isArray(valor) ? valor : [];
}

function obtenerTimelineDesdeMejorOpcion(planPorPartes = {}) {
  const opcion = planPorPartes.mejorOpcionPlan || planPorPartes.opcionesPlan?.mejorOpcion || planPorPartes.opcionesPlan?.mejorOpcionPlan || null;
  return arr(opcion?.respuesta?.jsonTecnico?.timeline || opcion?.jsonTecnico?.timeline || opcion?.planEjecutable?.timeline);
}

function obtenerTimelineDesdePartes(planPorPartes = {}) {
  return arr(planPorPartes.partes).flatMap((parte) => arr(parte.jsonTecnico?.timeline).map((item) => ({ ...item, origenParte: parte.id, parteTitulo: parte.titulo })));
}

function obtenerTimelineDesdeProduccion(planProduccion = {}) {
  return arr(planProduccion.elementos).map((elemento) => ({
    id: elemento.id,
    inicio: elemento.inicio ?? elemento.datos?.inicio,
    fin: elemento.fin ?? elemento.datos?.fin,
    accion: elemento.tipo,
    textoPantalla: elemento.datos?.texto || elemento.nombre,
    recursoBiblioteca: elemento.datos?.biblioteca?.id || elemento.biblioteca?.id || null,
    efecto: elemento.tipo === 'efecto' || elemento.tipo === 'zoom' ? elemento.nombre : null,
    audio: elemento.tipo === 'audio' ? elemento.nombre : null,
    motivo: elemento.descripcion || elemento.datos?.motivo || '',
    origenParte: 'planProduccion'
  }));
}

export function crearAccionPlanEjecutable(item = {}, index = 0) {
  const inicio = Math.max(0, numero(item.inicio ?? item.start ?? item.segundo, index * 2));
  let fin = numero(item.fin ?? item.end, inicio + numero(item.duracion, 2.5));
  if (fin <= inicio) fin = inicio + 2.5;
  const accion = texto(item.accion || item.tipo || item.pista, index === 0 ? 'gancho_inicial' : 'accion_edicion');
  return {
    id: texto(item.id, `accion-${index + 1}`),
    orden: index + 1,
    inicio: Number(inicio.toFixed(2)),
    fin: Number(fin.toFixed(2)),
    duracion: Number(Math.max(0.2, fin - inicio).toFixed(2)),
    accion,
    tipo: texto(item.tipo || accion, accion),
    pista: texto(item.pista || item.track, ''),
    textoPantalla: texto(item.textoPantalla || item.texto || item.titulo || item.nombre, ''),
    subtitulo: texto(item.subtitulo || item.caption, ''),
    recursoBiblioteca: item.recursoBiblioteca || item.biblioteca?.id || item.recurso?.id || null,
    efecto: texto(item.efecto || item.fx, ''),
    audio: texto(item.audio || item.sonido, ''),
    transicion: texto(item.transicion || item.transition, ''),
    motivo: texto(item.motivo || item.descripcion || item.reason, 'Accion generada desde el plan.'),
    origenParte: texto(item.origenParte || item.parteId, ''),
    prioridad: numero(item.prioridad, index + 1),
    datos: item.datos || item
  };
}

export function crearPlanEjecutableModelo({ proyecto = {}, contextoPlan = {}, planPorPartes = {}, planProduccion = {}, fuente = 'plan-ia' } = {}) {
  const timelineBase = obtenerTimelineDesdeMejorOpcion(planPorPartes);
  const timelinePartes = timelineBase.length ? timelineBase : obtenerTimelineDesdePartes(planPorPartes);
  const timelineFinal = timelinePartes.length ? timelinePartes : obtenerTimelineDesdeProduccion(planProduccion);
  const timeline = timelineFinal.map(crearAccionPlanEjecutable).sort((a, b) => a.inicio - b.inicio || a.orden - b.orden);
  const recursos = [...new Set(timeline.map((item) => item.recursoBiblioteca).filter(Boolean))];
  const opcion = planPorPartes.mejorOpcionPlan || planPorPartes.opcionesPlan?.mejorOpcion || null;

  return {
    ok: timeline.length > 0,
    tipo: 'plan-ejecutable-produccion',
    version: VERSION_PLAN_EJECUTABLE,
    proyectoId: proyecto.id || contextoPlan.proyectoId || planProduccion.proyectoId || null,
    fuente,
    opcionSeleccionada: opcion?.id || planPorPartes.resumen?.mejorOpcionId || null,
    proveedor: opcion?.proveedor || planPorPartes.resumen?.mejorProveedor || planPorPartes.resumen?.proveedorPrincipal || 'fallback',
    resumenHumano: opcion?.respuesta?.resumenHumano || planPorPartes.partes?.[0]?.resumenHumano || planProduccion.resumen || 'Plan ejecutable creado.',
    timeline,
    recursos,
    salidaProduccion: {
      usarTimelineEjecutable: true,
      totalAcciones: timeline.length,
      totalRecursos: recursos.length,
      compatibleConPistas: true
    },
    metadata: {
      contextoResumen: contextoPlan.resumen || {},
      partesResumen: planPorPartes.resumen || {},
      produccionResumen: {
        totalElementos: arr(planProduccion.elementos).length,
        duracionSegundos: planProduccion.duracionSegundos || 0
      }
    },
    creadoEn: new Date().toISOString()
  };
}

export default crearPlanEjecutableModelo;
