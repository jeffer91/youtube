/*
  Bloque 10: Optimización y seguridad del motor de efectos
  Función: evitar filtros duplicados, zooms acumulados y exceso de efectos simultáneos.
*/

import { buscarEfectoPorId } from '../catalogo/index.js';
import { obtenerRecetaFfmpeg, TIPOS_RECETA_FFMPEG } from '../ffmpeg/index.js';

function numero(valor, respaldo = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function ordenarPorPrioridad(efectos = []) {
  return [...efectos].sort((a, b) => numero(a.prioridad, 50) - numero(b.prioridad, 50) || numero(a.inicio, 0) - numero(b.inicio, 0));
}

function ordenarTimeline(efectos = []) {
  return [...efectos].sort((a, b) => numero(a.inicio, 0) - numero(b.inicio, 0) || numero(a.prioridad, 50) - numero(b.prioridad, 50));
}

function claveGlobal(receta) {
  if (!receta) return null;
  if ([TIPOS_RECETA_FFMPEG.COLOR, TIPOS_RECETA_FFMPEG.NITIDEZ, TIPOS_RECETA_FFMPEG.VINETA, TIPOS_RECETA_FFMPEG.BLUR, TIPOS_RECETA_FFMPEG.BARRA].includes(receta.tipo)) return receta.tipo;
  if (receta.tipo === TIPOS_RECETA_FFMPEG.ZOOM) return 'zoom_global';
  return null;
}

function esTexto(receta) {
  return receta?.tipo === TIPOS_RECETA_FFMPEG.TEXTO || receta?.tipo === TIPOS_RECETA_FFMPEG.MARCA;
}

function tieneSolape(a, b, margen = 0.35) {
  const ai = numero(a.inicio, 0);
  const af = numero(a.fin, ai + 1);
  const bi = numero(b.inicio, 0);
  const bf = numero(b.fin, bi + 1);
  return ai < bf + margen && bi < af + margen;
}

function limitesPorIntensidad(intensidad = 'normal') {
  const id = String(intensidad || 'normal').toLowerCase();
  if (id === 'suave') return { maxTextos: 3, maxCajas: 1, maxTransiciones: 2, maxMarcas: 1 };
  if (id === 'fuerte') return { maxTextos: 6, maxCajas: 2, maxTransiciones: 3, maxMarcas: 1 };
  return { maxTextos: 4, maxCajas: 1, maxTransiciones: 2, maxMarcas: 1 };
}

export function optimizarPlanEfectos(seleccion = {}, contexto = {}, { maxEfectos = 12 } = {}) {
  const entrada = Array.isArray(seleccion?.efectos) ? seleccion.efectos : [];
  const intensidad = contexto?.intensidad?.id || seleccion?.intensidad || 'normal';
  const limites = limitesPorIntensidad(intensidad);
  const advertencias = [];
  const usadosGlobales = new Set();
  const textos = [];
  const salida = [];
  const contadores = { textos: 0, cajas: 0, transiciones: 0, marcas: 0 };

  for (const item of ordenarPorPrioridad(entrada)) {
    const efectoId = item.efectoId || item.id || item.efecto;
    const efectoCatalogo = buscarEfectoPorId(efectoId);
    const receta = obtenerRecetaFfmpeg(efectoId);

    if (!efectoCatalogo) {
      advertencias.push(`Omitido por no existir en catalogo: ${efectoId}`);
      continue;
    }
    if (!receta) {
      advertencias.push(`Omitido porque no tiene receta FFmpeg segura: ${efectoId}`);
      continue;
    }

    const global = claveGlobal(receta);
    if (global && usadosGlobales.has(global)) {
      advertencias.push(`Omitido para evitar acumulación de filtro global: ${efectoId}`);
      continue;
    }

    if (receta.tipo === TIPOS_RECETA_FFMPEG.CAJA && contadores.cajas >= limites.maxCajas) {
      advertencias.push(`Omitido por límite de overlays/cajas: ${efectoId}`);
      continue;
    }

    if (receta.tipo === TIPOS_RECETA_FFMPEG.FADE && contadores.transiciones >= limites.maxTransiciones) {
      advertencias.push(`Omitido por límite de transiciones: ${efectoId}`);
      continue;
    }

    if (receta.tipo === TIPOS_RECETA_FFMPEG.MARCA && contadores.marcas >= limites.maxMarcas) {
      advertencias.push(`Omitido por límite de marca: ${efectoId}`);
      continue;
    }

    if (esTexto(receta)) {
      if (contadores.textos >= limites.maxTextos) {
        advertencias.push(`Omitido por límite de textos visibles: ${efectoId}`);
        continue;
      }
      if (textos.some((previo) => tieneSolape(previo, item))) {
        advertencias.push(`Omitido para evitar texto superpuesto: ${efectoId}`);
        continue;
      }
      textos.push(item);
      contadores.textos += 1;
    }

    if (global) usadosGlobales.add(global);
    if (receta.tipo === TIPOS_RECETA_FFMPEG.CAJA) contadores.cajas += 1;
    if (receta.tipo === TIPOS_RECETA_FFMPEG.FADE) contadores.transiciones += 1;
    if (receta.tipo === TIPOS_RECETA_FFMPEG.MARCA) contadores.marcas += 1;

    salida.push(item);
    if (salida.length >= Math.max(1, numero(maxEfectos, 12))) break;
  }

  return {
    ...seleccion,
    optimizado: true,
    totalEntrada: entrada.length,
    total: salida.length,
    efectos: ordenarTimeline(salida),
    advertencias: [...(seleccion?.advertencias || []), ...advertencias],
    reglas: {
      filtrosGlobalesUnicos: true,
      evitarTextosSolapados: true,
      limitesPorIntensidad: limites
    },
    mensaje: `Plan optimizado: ${salida.length}/${entrada.length} efectos seguros.`
  };
}

export default optimizarPlanEfectos;
