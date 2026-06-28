/*
  Modulo: produccion
  Funcion: armar el plan revisable desde modulos previos, incluyendo JSON tecnico ejecutable.
*/

import { crearPlanProduccionModelo, crearElementoProduccion } from './produccion.modelo.js';
import { PRODUCCION_CONFIG } from './produccion.config.js';
import { sincronizarLineaTiempoConElementos } from './linea-tiempo-produccion.service.js';

function elementosDesdeLista(lista = [], tipo, extra = {}) {
  return lista.map((item, indice) => crearElementoProduccion({
    id: item.id || `${tipo}-${indice + 1}`,
    tipo,
    nombre: item.nombre || item.texto || item.textoPantalla || item.accion || item.tipo || `${tipo} ${indice + 1}`,
    descripcion: item.descripcion || item.motivo || item.texto || item.textoPantalla || '',
    inicio: item.inicio ?? item.start ?? null,
    fin: item.fin ?? item.end ?? null,
    recurso: item.recurso || item.recursoBiblioteca || null,
    datos: item,
    ...extra
  }));
}

function elementosDesdePlanEjecutable(planEjecutable = {}, perfil = 'general') {
  const timeline = Array.isArray(planEjecutable.timeline) ? planEjecutable.timeline : [];
  return timeline.map((accion, indice) => {
    const tipo = accion.subtitulo ? PRODUCCION_CONFIG.tiposElemento.subtitulo
      : accion.textoPantalla ? PRODUCCION_CONFIG.tiposElemento.texto
        : accion.efecto ? PRODUCCION_CONFIG.tiposElemento.efecto
          : accion.audio ? PRODUCCION_CONFIG.tiposElemento.audio
            : PRODUCCION_CONFIG.tiposElemento.recurso;
    return crearElementoProduccion({
      id: `ejecutable-${accion.id || indice + 1}`,
      tipo,
      nombre: accion.textoPantalla || accion.subtitulo || accion.efecto || accion.audio || accion.accion || `Accion ${indice + 1}`,
      descripcion: accion.motivo || 'Accion proveniente del JSON tecnico ejecutable.',
      inicio: accion.inicio,
      fin: accion.fin,
      recurso: accion.recursoBiblioteca || null,
      perfil,
      origen: 'plan-ejecutable',
      datos: {
        ...accion,
        planEjecutable: true,
        biblioteca: accion.recursoBiblioteca ? { id: accion.recursoBiblioteca, origen: 'referenciado' } : null
      }
    });
  });
}

function extraerAnimaciones(visual = {}) {
  if (Array.isArray(visual.animaciones?.animaciones)) return visual.animaciones.animaciones;
  if (Array.isArray(visual.animaciones)) return visual.animaciones;
  return [];
}

function extraerEfectos(visual = {}) {
  const efectos = [];
  if (Array.isArray(visual.efectos?.efectos)) efectos.push(...visual.efectos.efectos);
  if (Array.isArray(visual.efectos?.plan?.efectos)) efectos.push(...visual.efectos.plan.efectos);
  if (Array.isArray(visual.efectos)) efectos.push(...visual.efectos);
  return efectos;
}

function extraerZooms(visual = {}) {
  if (Array.isArray(visual.zooms?.zooms)) return visual.zooms.zooms;
  if (Array.isArray(visual.zooms)) return visual.zooms;
  return [];
}

export function crearPlanProduccion({ proyecto = {}, recursos = [], subtitulos = [], textos = [], graficos = [], tablas = [], imagenes = [], visual = {}, audio = null, duracionSegundos = 0, planEjecutable = null } = {}) {
  const elementosEjecutables = planEjecutable?.tipo === 'plan-ejecutable-produccion' ? elementosDesdePlanEjecutable(planEjecutable, proyecto.perfil) : [];
  const elementos = [
    ...elementosEjecutables,
    ...elementosDesdeLista(recursos, PRODUCCION_CONFIG.tiposElemento.recurso, { perfil: proyecto.perfil }),
    ...elementosDesdeLista(imagenes, PRODUCCION_CONFIG.tiposElemento.imagen, { perfil: proyecto.perfil }),
    ...elementosDesdeLista(subtitulos, PRODUCCION_CONFIG.tiposElemento.subtitulo, { perfil: proyecto.perfil }),
    ...elementosDesdeLista(textos, PRODUCCION_CONFIG.tiposElemento.texto, { perfil: proyecto.perfil }),
    ...elementosDesdeLista(graficos, PRODUCCION_CONFIG.tiposElemento.grafico, { perfil: proyecto.perfil }),
    ...elementosDesdeLista(tablas, PRODUCCION_CONFIG.tiposElemento.tabla, { perfil: proyecto.perfil })
  ];

  if (visual?.fondo) elementos.push(crearElementoProduccion({ tipo: PRODUCCION_CONFIG.tiposElemento.fondo, nombre: 'Fondo visual', datos: visual.fondo, perfil: proyecto.perfil, inicio: 0, fin: duracionSegundos || null }));
  elementos.push(...elementosDesdeLista(extraerZooms(visual), PRODUCCION_CONFIG.tiposElemento.zoom, { perfil: proyecto.perfil }));
  elementos.push(...elementosDesdeLista(extraerEfectos(visual), PRODUCCION_CONFIG.tiposElemento.efecto, { perfil: proyecto.perfil }));
  elementos.push(...elementosDesdeLista(extraerAnimaciones(visual), PRODUCCION_CONFIG.tiposElemento.animacion, { perfil: proyecto.perfil }));
  if (audio) elementos.push(crearElementoProduccion({ tipo: PRODUCCION_CONFIG.tiposElemento.audio, nombre: 'Plan de audio', datos: audio, perfil: proyecto.perfil, inicio: 0, fin: duracionSegundos || null }));

  const plan = crearPlanProduccionModelo({
    proyectoId: proyecto.id,
    perfil: proyecto.perfil || 'general',
    modo: proyecto.modoEdicion || PRODUCCION_CONFIG.modos.revisionCompleta,
    estado: PRODUCCION_CONFIG.estados.enRevision,
    resumen: planEjecutable?.tipo === 'plan-ejecutable-produccion'
      ? 'Plan de Produccion creado desde JSON tecnico ejecutable y elementos revisables.'
      : 'Plan de Produccion creado para revisar, aprobar, eliminar, cambiar tiempos o reemplazar elementos antes de exportar.',
    duracionSegundos,
    elementos,
    planEjecutable
  });

  return sincronizarLineaTiempoConElementos(plan);
}
