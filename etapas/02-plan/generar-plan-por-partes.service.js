/*
  Bloque 4-6 - Generador de Plan por partes con dos opciones y JSON ejecutable
  Funcion: crear secciones, validarlas, elegir la mejor opcion y producir instrucciones para Produccion.
*/

import { PARTES_PLAN_EDICION } from './partes-plan.config.js';
import { validarPartePlan } from './validar-parte-plan.service.js';
import { crearEstadoPlanPorPartes, guardarPartePlan, cerrarPlanPorPartes } from './guardar-parte-plan.service.js';
import { ejecutarPlanConIA } from '../../ia/ia.conexion.js';
import { generarOpcionesPlan } from './generar-opciones-plan.service.js';
import { crearPlanEjecutableModelo } from './plan-ejecutable.modelo.js';
import { repararPlanEjecutable } from './reparar-plan-ejecutable.service.js';

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
        'Devuelve JSON valido con: resumenHumano y jsonTecnico.',
        'jsonTecnico debe ser compatible con produccion y, cuando aplique, incluir timeline.'
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
  const opcionesPlan = await generarOpcionesPlan({ proyectoId, contextoPlan, planPorPartes: cerrado, opciones });
  const baseParaEjecutable = { ...cerrado, opcionesPlan, mejorOpcionPlan: opcionesPlan.mejorOpcion };
  const planEjecutableBase = crearPlanEjecutableModelo({ proyecto: contextoPlan.proyecto || { id: proyectoId }, contextoPlan, planPorPartes: baseParaEjecutable });
  const { plan: planEjecutable, validacion: validacionPlanEjecutable } = repararPlanEjecutable(planEjecutableBase);
  const listoParaProduccion = cerrado.progreso.conErrores === 0 && cerrado.progreso.completadas === cerrado.totalPartes && Boolean(opcionesPlan.seleccionAutomatica?.ok) && validacionPlanEjecutable.ok;
  return {
    ...cerrado,
    opcionesPlan,
    mejorOpcionPlan: opcionesPlan.mejorOpcion,
    planEjecutable,
    validacionPlanEjecutable,
    listoParaProduccion,
    resumen: {
      totalPartes: cerrado.totalPartes,
      completadas: cerrado.progreso.completadas,
      validadas: cerrado.progreso.validadas,
      conErrores: cerrado.progreso.conErrores,
      porcentaje: cerrado.progreso.porcentaje,
      proveedorPrincipal: cerrado.partes[0]?.proveedor || 'fallback',
      modo: usarIAReal ? 'ia-real-o-local' : 'fallback-estructurado',
      opcionesTotal: opcionesPlan.resumen.totalOpciones,
      mejorOpcionId: opcionesPlan.resumen.mejorId,
      mejorProveedor: opcionesPlan.resumen.proveedor,
      mejorPuntaje: opcionesPlan.resumen.puntaje,
      planEjecutableAcciones: planEjecutable.timeline.length,
      planEjecutableRecursos: planEjecutable.recursos.length,
      planEjecutableValido: validacionPlanEjecutable.ok
    }
  };
}

export default generarPlanPorPartes;
