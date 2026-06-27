import { redondearTiempo } from '../edicion-dinamica.config.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function obtenerPerfil(opciones = {}) {
  return String(opciones?.perfil || 'general').trim().toLowerCase();
}

function construirEnable(inicio, fin) {
  return `between(t\\,${numero(inicio).toFixed(3)}\\,${numero(fin).toFixed(3)})`;
}

function obtenerEstiloAnimacion(opciones = {}) {
  const perfil = obtenerPerfil(opciones);
  if (['11-contra-11', 'futbol'].includes(perfil)) return { perfil, nombre: 'Deportivo', color: '0x38bdf8@0.48', texto: 'BOOM!', cada: 5.2, duracion: 0.95, maximo: 8, pulso: 0.052, periodo: 4.2 };
  if (['jeff-isekai', 'anime'].includes(perfil)) return { perfil, nombre: 'Anime', color: '0xf472b6@0.48', texto: 'WOW!', cada: 4.8, duracion: 0.95, maximo: 9, pulso: 0.058, periodo: 3.9 };
  if (['creciaula', 'educacion'].includes(perfil)) return { perfil, nombre: 'Educativo', color: '0x22c55e@0.40', texto: 'CLAVE', cada: 6.2, duracion: 0.9, maximo: 7, pulso: 0.038, periodo: 5.2 };
  if (perfil === 'institucional') return { perfil, nombre: 'Institucional', color: '0x2563eb@0.34', texto: 'PUNTO', cada: 7.2, duracion: 0.8, maximo: 6, pulso: 0.030, periodo: 6.0 };
  if (perfil === 'el-don-historia') return { perfil, nombre: 'Narrativo', color: '0xf59e0b@0.38', texto: 'MIRA', cada: 7.0, duracion: 1.0, maximo: 6, pulso: 0.035, periodo: 5.8 };
  if (perfil === 'jeff-verso') return { perfil, nombre: 'Marca personal', color: '0xa78bfa@0.42', texto: 'IDEA', cada: 5.8, duracion: 0.9, maximo: 7, pulso: 0.044, periodo: 4.9 };
  return { perfil: 'general', nombre: 'General', color: '0x60a5fa@0.42', texto: 'CLAVE', cada: 6.0, duracion: 0.9, maximo: 7, pulso: 0.042, periodo: 5.0 };
}

function crearEventosFallback({ duracionSegundos = 0, estilo } = {}) {
  const duracion = numero(duracionSegundos, 0);
  if (duracion < 3) return [];
  const eventos = [];
  const cada = numero(estilo?.cada, 6);
  const duracionEvento = numero(estilo?.duracion, 0.9);
  const maximo = Math.max(3, Math.min(10, numero(estilo?.maximo, 7)));
  for (let inicio = 0.85; inicio < duracion - 0.8 && eventos.length < maximo; inicio += cada) {
    eventos.push({
      id: `animacion-fallback-${eventos.length + 1}`,
      tipo: eventos.length === 0 ? 'gancho-explosion' : 'transicion-flash',
      inicio: redondearTiempo(inicio),
      fin: redondearTiempo(Math.min(inicio + duracionEvento, duracion)),
      texto: estilo.texto,
      motivo: 'Animación automática de ritmo para evitar video plano.'
    });
  }
  return eventos;
}

function normalizarEventosAnimacion({ eventos = [], duracionSegundos = 0, estilo } = {}) {
  const duracion = numero(duracionSegundos, 0);
  const base = eventos
    .filter((evento) => Number.isFinite(Number(evento.inicio)))
    .map((evento, index) => {
      const inicio = Math.max(0, numero(evento.inicio, index * 5));
      const fin = Math.min(duracion || inicio + 1, Math.max(inicio + 0.35, numero(evento.fin, inicio + numero(estilo?.duracion, 0.9))));
      return { ...evento, inicio: redondearTiempo(inicio), fin: redondearTiempo(fin), texto: evento.texto || estilo.texto };
    })
    .filter((evento) => evento.fin > evento.inicio)
    .slice(0, Math.max(3, Math.min(10, numero(estilo?.maximo, 7))));

  return base.length ? base : crearEventosFallback({ duracionSegundos, estilo });
}

function crearFiltroZoomInOut({ width, height, estilo }) {
  const w = Math.round(numero(width, 1080));
  const h = Math.round(numero(height, 1920));
  const pulso = Math.max(0.02, Math.min(0.075, numero(estilo.pulso, 0.042)));
  const periodo = Math.max(3.2, Math.min(7.0, numero(estilo.periodo, 5.0)));
  const expr = `(1+${pulso.toFixed(3)}*sin(6.28318*t/${periodo.toFixed(2)}))`;
  return `scale=w='${w}*${expr}':h='${h}*${expr}':eval=frame,crop=w=${w}:h=${h}:x=(iw-${w})/2:y=(ih-${h})/2`;
}

function crearFiltroFlash(evento, estilo) {
  const inicio = numero(evento.inicio, 0);
  const fin = Math.min(numero(evento.fin, inicio + 0.6), inicio + 0.65);
  const enable = construirEnable(inicio, fin);
  return `drawbox=x=0:y=0:w=iw:h=ih:color=${estilo.color}:t=fill:enable='${enable}'`;
}

function crearFiltroExplosion(evento, estilo, index) {
  const inicio = numero(evento.inicio, 0);
  const fin = Math.min(numero(evento.fin, inicio + 0.75), inicio + 0.75);
  const enable = construirEnable(inicio, fin);
  const texto = String(index === 0 ? estilo.texto : (evento.texto || estilo.texto || 'WOW')).replace(/'/g, '').slice(0, 14).toUpperCase();
  return [
    'drawtext',
    `text='${texto}'`,
    'x=(w-text_w)/2',
    'y=h*0.34',
    'fontsize=82',
    'fontcolor=yellow',
    'borderw=7',
    'bordercolor=black@0.92',
    'shadowcolor=red@0.65',
    'shadowx=5',
    'shadowy=5',
    'box=1',
    'boxcolor=red@0.26',
    'boxborderw=24',
    `enable='${enable}'`
  ].join(':');
}

function crearFiltroBarrasTransicion(evento) {
  const inicio = numero(evento.inicio, 0);
  const fin = Math.min(numero(evento.fin, inicio + 0.55), inicio + 0.55);
  const enable = construirEnable(inicio, fin);
  return `drawbox=x=0:y=h*0.08:w=iw:h=18:color=white@0.55:t=fill:enable='${enable}',drawbox=x=0:y=h*0.90:w=iw:h=18:color=white@0.55:t=fill:enable='${enable}'`;
}

export function generarAnimacionesFfmpeg({ eventos = [], duracionSegundos = 0, width = 1080, height = 1920, opciones = {} } = {}) {
  const activo = opciones.agregarAnimacionesVisuales !== false && opciones.agregarAnimaciones !== false;
  if (!activo) return { ok: true, omitido: true, eventos: [], filtrosMovimiento: [], filtrosOverlay: [], mensaje: 'Animaciones visuales desactivadas.' };

  const estilo = obtenerEstiloAnimacion(opciones);
  const eventosAnimacion = normalizarEventosAnimacion({ eventos, duracionSegundos, estilo });
  const filtrosMovimiento = [crearFiltroZoomInOut({ width, height, estilo })];
  const filtrosOverlay = [];

  eventosAnimacion.forEach((evento, index) => {
    filtrosOverlay.push(crearFiltroFlash(evento, estilo));
    filtrosOverlay.push(crearFiltroBarrasTransicion(evento));
    if (index === 0 || ['punch-in', 'gancho-explosion', 'momento-importante'].includes(evento.tipo)) filtrosOverlay.push(crearFiltroExplosion(evento, estilo, index));
  });

  return {
    ok: true,
    omitido: false,
    estilo,
    total: eventosAnimacion.length,
    eventos: eventosAnimacion,
    filtrosMovimiento,
    filtrosOverlay,
    filtros: [...filtrosMovimiento, ...filtrosOverlay],
    mensaje: `${eventosAnimacion.length} animaciones visibles generadas: zoom in/out, flashes, barras de transición y explosión visual.`
  };
}

export default generarAnimacionesFfmpeg;
