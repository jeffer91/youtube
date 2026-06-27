/*
  Motor de animaciones renderizadas
  Función: agregar animaciones visibles al filtro FFmpeg final, no solo al plan de Producción.
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

  if (fuente.length) return fuente.slice(0, 8);
  const base = duracion > 0 ? duracion : 30;
  return [
    { id: 'gancho-inicial', inicio: 0.25, fin: Math.min(2.1, base), texto: 'gancho inicial' },
    { id: 'refuerzo-1', inicio: Math.min(base * 0.22, base - 2), fin: Math.min(base * 0.22 + 1.4, base), texto: 'refuerzo visual' },
    { id: 'refuerzo-2', inicio: Math.min(base * 0.50, base - 2), fin: Math.min(base * 0.50 + 1.4, base), texto: 'momento clave' },
    { id: 'cierre', inicio: Math.max(0, base - 3.2), fin: Math.max(1, base - 1.0), texto: 'cierre visual' }
  ];
}

function elegirIntensidad(opciones = {}) {
  const valor = String(opciones.intensidadAnimaciones || opciones.intensidadEfectos || opciones.intensidadEdicion || 'normal').toLowerCase();
  if (['fuerte', 'alta', 'muy_dinamica', 'dinamica'].includes(valor)) return 'fuerte';
  if (['suave', 'baja', 'limpia'].includes(valor)) return 'suave';
  return 'normal';
}

function crearAnimacionDesdeMomento(momento, indice, contexto) {
  const duracion = Math.max(0.7, Math.min(1.8, numero(momento.fin, momento.inicio + 1.2) - numero(momento.inicio, 0)));
  const inicio = Math.max(0, numero(momento.inicio, indice * 4));
  const fin = inicio + duracion;
  const intensidad = contexto.intensidad;
  const alpha = intensidad === 'fuerte' ? 0.30 : intensidad === 'suave' ? 0.16 : 0.22;
  const grosor = intensidad === 'fuerte' ? 10 : intensidad === 'suave' ? 4 : 7;
  const tipo = ['barrido_lateral', 'pulso_borde', 'flash_gancho', 'barra_inferior', 'acento_superior'][indice % 5];
  let filtro = '';

  if (tipo === 'barrido_lateral') {
    filtro = `drawbox=x='-iw*0.28+(t-${inicio.toFixed(3)})*iw*0.72':y=ih*0.18:w=iw*0.22:h=ih*0.64:color=white@${alpha.toFixed(2)}:t=fill:${construirEnable(inicio, fin)}`;
  }
  if (tipo === 'pulso_borde') {
    filtro = `drawbox=x=24:y=24:w=iw-48:h=ih-48:color=white@${alpha.toFixed(2)}:t=${grosor}:${construirEnable(inicio, fin)}`;
  }
  if (tipo === 'flash_gancho') {
    filtro = `drawbox=x=0:y=0:w=iw:h=ih:color=white@${(alpha * 0.55).toFixed(2)}:t=fill:${construirEnable(inicio, Math.min(fin, inicio + 0.42))}`;
  }
  if (tipo === 'barra_inferior') {
    filtro = `drawbox=x='iw*0.08':y='ih*0.82':w='iw*0.84':h=18:color=white@${alpha.toFixed(2)}:t=fill:${construirEnable(inicio, fin)}`;
  }
  if (tipo === 'acento_superior') {
    filtro = `drawbox=x='iw*0.08+(t-${inicio.toFixed(3)})*80':y='ih*0.10':w='iw*0.42':h=14:color=white@${alpha.toFixed(2)}:t=fill:${construirEnable(inicio, fin)}`;
  }

  return {
    id: `render-animacion-${indice + 1}`,
    tipo,
    inicio: Number(inicio.toFixed(2)),
    fin: Number(fin.toFixed(2)),
    intensidad,
    momentoId: momento.id || null,
    texto: momento.texto || '',
    filtro
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
  const cantidadMaxima = Math.round(limitar(numero(opciones.maxAnimacionesVisuales, intensidad === 'fuerte' ? 8 : 6), 3, 10));
  const animaciones = momentos.slice(0, cantidadMaxima).map((momento, indice) => crearAnimacionDesdeMomento(momento, indice, { intensidad, width: salida.width || 1080, height: salida.height || 1920 })).filter((item) => item.filtro);

  const filtrosAnimacion = animaciones.map((item) => item.filtro);
  const filtroVideo = [filtroBase, ...filtrosAnimacion].filter(Boolean).join(',');
  return {
    ok: true,
    omitido: animaciones.length === 0,
    mensaje: animaciones.length ? `${animaciones.length} animación(es) renderizadas en el video final.` : 'No se generaron animaciones renderizables.',
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
