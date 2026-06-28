/*
  Bloque 4 - Generador de Plan por partes
  Función: pedir/crear cada sección del Plan, validarla y guardarla antes de seguir.
*/

import { PARTES_PLAN_EDICION } from './partes-plan.config.js';
import { validarPartePlan } from './validar-parte-plan.service.js';
import { crearEstadoPlanPorPartes, guardarPartePlan, cerrarPlanPorPartes } from './guardar-parte-plan.service.js';
import { ejecutarPlanConIA } from '../../ia/ia.conexion.js';

function texto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return limpio || respaldo;
}

function construirContextoParte({ contextoPlan = {}, parte = {}, partesPrevias = [] } = {}) {
  const promptBase = contextoPlan.contextoIA?.promptBase || '';
  return {
    ...contextoPlan,
    parteActual: {
      id: parte.id,
      orden: parte.orden,
      titulo: parte.titulo,
      descripcion: parte.descripcion,
      requiere: parte.requiere,
      salidaEsperada: parte.salidaEsperada
    },
    partesPrevias: partesPrevias.map((item) => ({
      id: item.id,
      titulo: item.titulo,
      validada: Boolean(item.validacion?.ok),
      resumenHumano: item.resumenHumano,
      timeline: item.jsonTecnico?.timeline || []
    })),
    contextoIA: {
      ...(contextoPlan.contextoIA || {}),
      promptBase: [
        promptBase,
        '',
        `PARTE ACTUAL ${parte.orden}/${PARTES_PLAN_EDICION.length}: ${parte.titulo}`,
        parte.descripcion,
        `Debe devolver solo esta parte: ${parte.id}.`,
        `Requiere: ${(parte.requiere || []).join(', ')}.`,
        `Salida esperada: ${(parte.salidaEsperada || []).join(', ')}.`,
        'Devuelve JSON válido con: resumenHumano y jsonTecnico.',
        'jsonTecnico debe ser compatible con producción y, cuando aplique, incluir timeline.'
      ].filter(Boolean).join('\n')
    }
  };
}

function crearParteDesdeRespuesta({ parte = {}, respuesta = {}, intento = {} } = {}) {
  const jsonTecnicoBase = respuesta.jsonTecnico || {};
  const timelineBase = Array.isArray(jsonTecnicoBase.timeline) ? jsonTecnicoBase.timeline : [];
  return {
    id: parte.id,
    orden: parte.orden,
    titulo: parte.titulo,
    descripcion: parte.descripcion,
    estado: 'generada',
    proveedor: respuesta.proveedor || intento.proveedorSeleccionado || 'fallback',
    modelo: respuesta.modelo || '',
    familiaIA: respuesta.proveedor === 'gemini' ? 'remota-gratis' : respuesta.proveedor === 'fallback' ? 'interna' : 'local-gratis',
    resumenHumano: texto(respuesta.resumenHumano, `${parte.titulo} generado.`),
    jsonTecnico: {
      ...jsonTecnicoBase,
      parteId: parte.id,
      parteTitulo: parte.titulo,
      timeline: timelineBase
    },
    respuestaIA: respuesta,
    erroresPrevios: intento.erroresPrevios || [],
    generadoEn: new Date().toISOString()
  };
}

export async function generarPlanPorPartes({ proyectoId = '', contextoPlan = {}, opciones = {} } = {}) {
  const usarIAReal = Boolean(opciones.usarIARealPlanPorPartes || opciones.activarIARealPlanPorPartes);
  const proveedorPorDefecto = usarIAReal ? (opciones.proveedorIA || opciones.proveedor || 'automatico') : 'fallback';
  let estado = crearEstadoPlanPorPartes({ proyectoId, contextoPlan });

  for (const parte of PARTES_PLAN_EDICION) {
    const contextoParte = construirContextoParte({ contextoPlan, parte, partesPrevias: estado.partes });
    const intento = await ejecutarPlanConIA({
      contextoPlan: contextoParte,
      proveedor: proveedorPorDefecto,
      modo: usarIAReal ? 'automatico' : 'manual',
      opciones: {
        ...opciones,
        proveedor: proveedorPorDefecto,
        motivo: `Generando parte ${parte.id}`
      }
    });

    const parteGenerada = crearParteDesdeRespuesta({ parte, respuesta: intento.respuesta, intento });
    const validacion = validarPartePlan(parteGenerada);
    const parteFinal = {
      ...parteGenerada,
      estado: validacion.ok ? 'validada' : 'observada',
      validacion
    };
    estado = guardarPartePlan(estado, parteFinal);
  }

  const cerrado = cerrarPlanPorPartes(estado);
  return {
    ...cerrado,
    listoParaProduccion: cerrado.progreso.conErrores === 0 && cerrado.progreso.completadas === cerrado.totalPartes,
    resumen: {
      totalPartes: cerrado.totalPartes,
      completadas: cerrado.progreso.completadas,
      validadas: cerrado.progreso.validadas,
      conErrores: cerrado.progreso.conErrores,
      porcentaje: cerrado.progreso.porcentaje,
      proveedorPrincipal: cerrado.partes[0]?.proveedor || 'fallback',
      modo: usarIAReal ? 'ia-real-o-local' : 'fallback-estructurado'
    }
  };
}

export default generarPlanPorPartes;
