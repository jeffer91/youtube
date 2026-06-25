import { BROLL_CONFIG, obtenerConfigBroll } from './broll.config.js';

function normalizarTexto(valor = '') {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function recortar(texto = '', max = 90) {
  const limpio = normalizarTexto(texto);
  if (limpio.length <= max) return limpio;
  return `${limpio.slice(0, max - 1).trim()}…`;
}

function obtenerPuntosImportantes({ inteligencia = null, transcripcion = null } = {}) {
  if (Array.isArray(inteligencia?.puntosImportantes?.puntos) && inteligencia.puntosImportantes.puntos.length) {
    return inteligencia.puntosImportantes.puntos;
  }
  if (Array.isArray(transcripcion?.transcripcion?.segmentos)) {
    return transcripcion.transcripcion.segmentos
      .filter((segmento) => String(segmento?.texto || '').trim())
      .slice(0, 8)
      .map((segmento, index) => ({
        id: `segmento-${index + 1}`,
        inicio: segmento.inicio ?? index * 4,
        fin: segmento.fin ?? (index * 4) + 3,
        texto: segmento.texto || '',
        puntaje: 1
      }));
  }
  return [];
}

function obtenerPalabrasClave(inteligencia = null) {
  const desdeSeo = inteligencia?.seo?.palabrasClave || [];
  return desdeSeo.map((item) => item?.palabra || item).filter(Boolean).slice(0, 12);
}

function crearConsultaBusqueda({ punto, palabrasClave, perfilVisual }) {
  const texto = normalizarTexto(punto?.texto || '');
  const palabrasPunto = texto.split(' ').filter((palabra) => palabra.length >= 5).slice(0, 4);
  const extras = palabrasClave.slice(0, 3);
  const perfil = perfilVisual?.id || perfilVisual?.nombre || '';
  return [...new Set([...palabrasPunto, ...extras, perfil].filter(Boolean))].join(' ');
}

function elegirTipo({ perfilVisual, index }) {
  const perfil = String(perfilVisual?.id || '').toLowerCase();
  if (perfil === 'formal') return index % 2 === 0 ? 'grafico-simple' : 'texto-contexto';
  if (perfil === 'futbol') return index % 2 === 0 ? 'video-apoyo' : 'imagen-apoyo';
  if (perfil === 'entretenimiento') return index % 3 === 0 ? 'video-apoyo' : 'imagen-apoyo';
  return index % 2 === 0 ? 'texto-contexto' : 'imagen-apoyo';
}

function obtenerTiempo(punto, campo, respaldo) {
  const valor = Number(punto?.[campo]);
  return Number.isFinite(valor) ? valor : respaldo;
}

export function sugerirBrollLocal({ inteligencia = null, transcripcion = null, entendimiento = null, opciones = {} } = {}) {
  const config = obtenerConfigBroll(opciones);
  if (!config.activo) {
    return { ok: true, omitido: true, estado: 'OMITIDO', mensaje: 'B-Roll desactivado.', items: [], config };
  }

  const puntos = obtenerPuntosImportantes({ inteligencia, transcripcion });
  const palabrasClave = obtenerPalabrasClave(inteligencia);
  const perfilVisual = opciones.perfilAplicado || null;
  const duracionVideo = Number(entendimiento?.analisis?.duracionSegundos || 0);

  const items = puntos.slice(0, config.maxSugerencias).map((punto, index) => {
    const inicioBase = obtenerTiempo(punto, 'inicio', index * config.separacionMinimaSegundos);
    const inicio = Math.max(0, inicioBase);
    const fin = Math.min(
      duracionVideo > 0 ? duracionVideo : inicio + config.duracionSugeridaSegundos,
      obtenerTiempo(punto, 'fin', inicio + config.duracionSugeridaSegundos)
    );
    const consulta = crearConsultaBusqueda({ punto, palabrasClave, perfilVisual });
    const tipo = elegirTipo({ perfilVisual, index });

    return {
      id: `broll-${index + 1}`,
      activo: true,
      estado: 'SUGERIDO',
      tipo,
      inicio,
      fin: Math.max(fin, inicio + 1),
      duracion: Number(Math.max(fin - inicio, 1).toFixed(2)),
      texto: recortar(punto.texto || consulta || 'B-Roll sugerido'),
      consultaBusqueda: consulta || 'recurso visual de apoyo',
      motivo: `Apoyo visual sugerido para reforzar: ${recortar(punto.texto || consulta, 110)}`,
      fuenteSugerida: 'manual / biblioteca propia / proveedor con licencia',
      licencia: 'PENDIENTE_VERIFICAR_MANUALMENTE',
      descargarAutomaticamente: false,
      requiereRevision: true
    };
  });

  return {
    ok: true,
    estado: items.length ? 'SUGERIDO_LOCAL' : 'SIN_DATOS',
    mensaje: items.length ? 'Sugerencias de B-Roll generadas localmente.' : 'No hay suficientes puntos para sugerir B-Roll.',
    version: BROLL_CONFIG.version,
    total: items.length,
    items,
    advertencias: [
      'Este módulo solo sugiere B-Roll; no descarga recursos externos.',
      'Antes de usar un recurso, verificar licencia, fuente y autorización.'
    ],
    config
  };
}

export default sugerirBrollLocal;
