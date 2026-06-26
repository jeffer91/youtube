/*
  Modulo: produccion
  Funcion: armar el plan revisable desde los modulos previos.
*/

import { crearPlanProduccionModelo, crearElementoProduccion } from './produccion.modelo.js';
import { PRODUCCION_CONFIG } from './produccion.config.js';

function elementosDesdeLista(lista = [], tipo, extra = {}) {
  return lista.map((item, indice) => crearElementoProduccion({
    id: item.id || `${tipo}-${indice + 1}`,
    tipo,
    nombre: item.nombre || item.texto || item.tipo || `${tipo} ${indice + 1}`,
    inicio: item.inicio ?? null,
    fin: item.fin ?? null,
    recurso: item.recurso || null,
    datos: item,
    ...extra
  }));
}

export function crearPlanProduccion({ proyecto = {}, recursos = [], subtitulos = [], textos = [], graficos = [], tablas = [], visual = {}, audio = null } = {}) {
  const elementos = [
    ...elementosDesdeLista(recursos, PRODUCCION_CONFIG.tiposElemento.recurso, { perfil: proyecto.perfil }),
    ...elementosDesdeLista(subtitulos, PRODUCCION_CONFIG.tiposElemento.subtitulo, { perfil: proyecto.perfil }),
    ...elementosDesdeLista(textos, PRODUCCION_CONFIG.tiposElemento.texto, { perfil: proyecto.perfil }),
    ...elementosDesdeLista(graficos, PRODUCCION_CONFIG.tiposElemento.grafico, { perfil: proyecto.perfil }),
    ...elementosDesdeLista(tablas, PRODUCCION_CONFIG.tiposElemento.tabla, { perfil: proyecto.perfil })
  ];

  if (visual?.fondo) elementos.push(crearElementoProduccion({ tipo: PRODUCCION_CONFIG.tiposElemento.fondo, nombre: 'Fondo visual', datos: visual.fondo, perfil: proyecto.perfil }));
  if (visual?.zooms?.zooms) elementos.push(...elementosDesdeLista(visual.zooms.zooms, PRODUCCION_CONFIG.tiposElemento.zoom, { perfil: proyecto.perfil }));
  if (visual?.efectos?.efectos) elementos.push(...elementosDesdeLista(visual.efectos.efectos, PRODUCCION_CONFIG.tiposElemento.efecto, { perfil: proyecto.perfil }));
  if (audio) elementos.push(crearElementoProduccion({ tipo: PRODUCCION_CONFIG.tiposElemento.audio, nombre: 'Plan de audio', datos: audio, perfil: proyecto.perfil }));

  return crearPlanProduccionModelo({
    proyectoId: proyecto.id,
    perfil: proyecto.perfil || 'general',
    modo: proyecto.modoEdicion || PRODUCCION_CONFIG.modos.revisionCompleta,
    estado: PRODUCCION_CONFIG.estados.enRevision,
    resumen: 'Plan de Produccion creado para revisar, aprobar o reemplazar elementos antes de exportar.',
    elementos
  });
}
