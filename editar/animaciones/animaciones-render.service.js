/*
  Motor de animaciones renderizadas
  Función: agregar animaciones visibles al filtro FFmpeg final: zoom in, zoom out, impacto/explosión, barridos y transiciones.
*/

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function booleano(valor, respaldo = true) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const limpio = valor.trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'yes', 'on', 'activo'].includes(limpio)) return true;
    if (['false', '0', 'no', 'off', 'inactivo'].includes(limpio)) return false;
  }
  return respaldo;
}

function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor));
}

function construirEnable(inicio, fin) {
  return `enable='between(t\,${numero(inicio, 0).toFixed(3)}\,${numero(fin, inicio + 1).toFixed(3)})'`;
}

function exprBetween(inicio, fin) {
  return `between(t\\,${inicio.toFixed(3)}\\,${fin.toFixed(3)})`;
}

function obtenerDuracion(entendimiento = {}, edicionDinamica = {}) {
  return numero(edicionDinamica?.mapaTiempo?.duracionEditada || edicionDinamica?.cortes?.resumen?.duracionEditada || entendimiento?.analisis?.duracionSegundos, 0);
}

function extraerMomentos(transcripcion = {}, duracion = 0) {
  const ganchos = transcripcion?.titulosGanchos?.ganchos || [];
  const importantes = transcripcion?.titulosGanchos?.momentosImportantes || [];
  const segmentos = transcripcion?.transcripcion?.segmentos || transcripcion?.segmentos || [];
  const fuente = [...ganchos, ...importantes, ...segmentos]
    .map((item, indice) => ({
      id: item.id || `momento-${indice + 1}`,
      inicio: limitar(numero(item.inicio ?? item.start ?? indice * 4, indice * 4), 0, Math.max(0, duracion - 0.8)),
      fin: limitar(numero(item.fin ?? item.end ?? numero(item.inicio ?? item.start ?? indice * 4, indice * 4) + 2.2, indice * 4 + 2.2), 0.6, Math.max(1, duracion)),
      texto: String(item.texto || item.text || item.nombre || '').trim()
    }))
    .filter((item) => item.inicio < item.fin);

  if (fuente.length) return fuente.slice(0, 10);
  const base = duracion > 0 ? duracion : 30;
  return [
    { id: 'gancho-inicial', inicio: 0.20, fin: Math.min(2.0, base), texto: 'zoom gancho inicial' },
    { id: 'transicion-1', inicio: Math.min(base * 0.18, base - 2), fin: Math.min(base * 0.18 + 1.1, base), texto: 'transición visual' },
    { id: 'impacto-1', inicio: Math.min(base * 0.34, base - 2), fin: Math.min(base * 0.34 + 1.0, base), texto: 'impacto divertido' },
    { id: 'zoom-out', inicio: Math.min(base * 0.52, base - 2), fin: Math.min(base * 0.52 + 1.3, base), texto: 'zoom out' },
    { id: 'transicion-2', inicio: Math.min(base * 0.70, base - 2), fin: Math.min(base * 0.70 + 1.1, base), texto: 'corte visual' },
    { id: 'cierre', inicio: Math.max(0, base - 3.2), fin: Math.max(1, base - 1.0), texto: 'cierre visual' }
  ];
}

function elegirIntensidad(opciones = {}) {
  const valor = String(opciones.intensidadAnimaciones || opciones.intensidadEfectos || opciones.intensidadEdicion || 'fuerte').toLowerCase();
  if (['suave', 'baja', 'limpia'].includes(valor)) return 'suave';
  if (['normal', 'media', 'equilibrada', 'automatica'].includes(valor)) return 'normal';
  return 'fuerte';
}

function expresionZoom(inicio, fin, tipo, fuerza) {
  const duracion = Math.max(0.35, fin - inicio).toFixed(3);
  const activo = exprBetween(inicio, fin);
  if (tipo === 'zoom_out') return `if(${activo}\,1+${fuerza.toFixed(3)}*(1-((t-${inicio.toFixed(3)})/${duracion}))\,1)`;
  if (tipo === 'explosion_pop') return `if(${activo}\,1+${fuerza.toFixed(3)}*sin(((t-${inicio.toFixed(3)})/${duracion})*PI)\,1)`;
  return `if(${activo}\,1+${fuerza.toFixed(3)}*((t-${inicio.toFixed(3)})/${duracion})\,1)`;
}

function filtroZoomAnimado({ inicio, fin, tipo, width, height, fuerza }) {
  const w = Math.round(width || 1080);
  const h = Math.round(height || 1920);
  const zoom = expresionZoom(inicio, fin, tipo, fuerza);
  return `scale=w='${w}*${zoom}':h='${h}*${zoom}':eval=frame,crop=${w}:${h}:(iw-ow)/2:(ih-oh)/2`;
}

function filtroFlashExplosion({ inicio, fin, alpha }) {
  return `drawbox=x=0:y=0:w=iw:h=ih:color=white@${alpha.toFixed(2)}:t=fill:${construirEnable(inicio, Math.min(fin, inicio + 0.24))}`;
}

function filtroBarrido({ inicio, fin, alpha }) {
  return `drawbox=x='-iw*0.35+(t-${inicio.toFixed(3)})*iw*0.95':y=0:w=iw*0.30:h=ih:color=white@${alpha.toFixed(2)}:t=fill:${construirEnable(inicio, fin)}`;
}

function filtroCorteFlash({ inicio, alpha }) {
  const fin = inicio + 0.18;
  return `drawbox=x=0:y=0:w=iw:h=ih:color=white@${alpha.toFixed(2)}:t=fill:${construirEnable(inicio, fin)}`;
}

function filtroBordeImpacto({ inicio, fin, alpha, grosor }) {
  return `drawbox=x=22:y=22:w=iw-44:h=ih-44:color=white@${alpha.toFixed(2)}:t=${grosor}:${construirEnable(inicio, fin)}`;
}

function crearAnimacionDesdeMomento(momento, indice, contexto) {
  const duracion = Math.max(0.75, Math.min(1.55, numero(momento.fin, momento.inicio + 1.2) - numero(momento.inicio, 0)));
  const inicio = Math.max(0, numero(momento.inicio, indice * 4));
  const fin = inicio + duracion;
  const intensidad = contexto.intensidad;
  const alpha = intensidad === 'fuerte' ? 0.34 : intensidad === 'suave' ? 0.17 : 0.25;
  const fuerzaZoom = intensidad === 'fuerte' ? 0.13 : intensidad === 'suave' ? 0.055 : 0.085;
  const grosor = intensidad === 'fuerte' ? 12 : intensidad === 'suave' ? 5 : 8;
  const secuencia = ['zoom_in', 'corte_flash', 'explosion_pop', 'zoom_out', 'barrido_transicion', 'pulso_borde'];
  const tipo = secuencia[indice % secuencia.length];
  const filtros = [];

  if (tipo === 'zoom_in') filtros.push(filtroZoomAnimado({ inicio, fin, tipo, width: contexto.width, height: contexto.height, fuerza: fuerzaZoom }));
  if (tipo === 'zoom_out') filtros.push(filtroZoomAnimado({ inicio, fin, tipo, width: contexto.width, height: contexto.height, fuerza: fuerzaZoom }));
  if (tipo === 'explosion_pop') {
    filtros.push(filtroZoomAnimado({ inicio, fin, tipo, width: contexto.width, height: contexto.height, fuerza: fuerzaZoom * 1.35 }));
    filtros.push(filtroFlashExplosion({ inicio, fin, alpha: alpha * 0.65 }));
    filtros.push(filtroBordeImpacto({ inicio, fin: Math.min(fin, inicio + 0.55), alpha, grosor }));
  }
  if (tipo === 'barrido_transicion') filtros.push(filtroBarrido({ inicio, fin, alpha: alpha * 0.75 }));
  if (tipo === 'corte_flash') filtros.push(filtroCorteFlash({ inicio, alpha: alpha * 0.65 }));
  if (tipo === 'pulso_borde') filtros.push(filtroBordeImpacto({ inicio, fin, alpha, grosor }));

  return {
    id: `render-animacion-${indice + 1}`,
    tipo,
    inicio: Number(inicio.toFixed(2)),
    fin: Number(fin.toFixed(2)),
    intensidad,
    momentoId: momento.id || null,
    texto: momento.texto || '',
    filtros,
    filtro: filtros.join(',')
  };
}

export function aplicarAnimacionesRender({ filtroBase = '', entendimiento = {}, transcripcion = {}, edicionDinamica = {}, salida = {}, opciones = {} } = {}) {
  if (!filtroBase) return { ok: false, omitido: true, mensaje: 'No se pueden aplicar animaciones porque falta filtro base.', filtroVideo: filtroBase, animaciones: [] };
  if (!booleano(opciones.agregarAnimacionesVisuales ?? opciones.animacionesVisuales, true)) {
    return { ok: true, omitido: true, mensaje: 'Animaciones omitidas por configuración.', filtroVideo: filtroBase, animaciones: [] };
  }

  const duracion = obtenerDuracion(entendimiento, edicionDinamica) || 30;
  const intensidad = elegirIntensidad(opciones);
  const momentos = extraerMomentos(transcripcion, duracion);
  const cantidadMaxima = Math.round(limitar(numero(opciones.maxAnimacionesVisuales, intensidad === 'fuerte' ? 9 : 7), 4, 12));
  const contexto = { intensidad, width: salida.width || 1080, height: salida.height || 1920 };
  const animaciones = momentos.slice(0, cantidadMaxima).map((momento, indice) => crearAnimacionDesdeMomento(momento, indice, contexto)).filter((item) => item.filtro);

  const filtrosAnimacion = animaciones.flatMap((item) => item.filtros || [item.filtro]).filter(Boolean);
  const filtroVideo = [filtroBase, ...filtrosAnimacion].filter(Boolean).join(',');
  return {
    ok: true,
    omitido: animaciones.length === 0,
    mensaje: animaciones.length ? `${animaciones.length} animación(es) visibles: zoom in/out, explosión, barridos y transiciones.` : 'No se generaron animaciones renderizables.',
    filtroVideo,
    filtroBase,
    animaciones,
    filtrosAplicados: filtrosAnimacion.length,
    duracionSegundos: duracion,
    intensidad,
    salida: { width: salida.width || 1080, height: salida.height || 1920, fps: salida.fps || 30 },
    creadoEn: new Date().toISOString()
  };
}

export default aplicarAnimacionesRender;
