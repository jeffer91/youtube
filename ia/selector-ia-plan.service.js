/*
  Bloque 3 - Selector de IAs gratis para Plan
  Función: elegir proveedor manual/automático y generar una o dos opciones de plan.
*/

import { obtenerConfigIAPlan, ORDEN_AUTO_IA_PLAN, PROVEEDORES_LOCALES_IA_PLAN, listarProveedoresIAPlan } from './ia.config.js';
import { ejecutarGeminiPlan } from './proveedores/gemini-plan.service.js';
import { ejecutarOllamaPlan } from './proveedores/ollama-plan.service.js';
import { ejecutarLmStudioPlan } from './proveedores/lmstudio-plan.service.js';
import { ejecutarGpt4AllPlan } from './proveedores/gpt4all-plan.service.js';
import { ejecutarFallbackPlan } from './proveedores/fallback-plan.service.js';

const EJECUTORES = Object.freeze({
  gemini: ejecutarGeminiPlan,
  ollama: ejecutarOllamaPlan,
  lmstudio: ejecutarLmStudioPlan,
  gpt4all: ejecutarGpt4AllPlan,
  fallback: ejecutarFallbackPlan
});

function texto(valor = '', respaldo = '') {
  const limpio = String(valor ?? '').trim();
  return limpio || respaldo;
}

function ordenarSinDuplicados(lista = []) {
  return [...new Set(lista.filter(Boolean))];
}

export function diagnosticarProveedoresIAPlan(opciones = {}) {
  const config = obtenerConfigIAPlan(opciones);
  return listarProveedoresIAPlan(opciones).map((proveedor) => ({
    id: proveedor.id,
    nombre: proveedor.nombre,
    tipo: proveedor.tipo,
    prioridad: proveedor.prioridad,
    activo: Boolean(proveedor.activo),
    configurado: proveedor.id === 'gemini' ? Boolean(proveedor.apiKey) : true,
    requiereInternet: proveedor.requiereInternet,
    requiereApiKey: proveedor.requiereApiKey,
    modelo: proveedor.modelo,
    endpointBase: proveedor.id === 'gemini' ? proveedor.endpointBase : proveedor.endpointBase,
    seleccionable: Boolean(proveedor.activo) && (proveedor.id !== 'gemini' || Boolean(proveedor.apiKey))
  })).sort((a, b) => a.prioridad - b.prioridad);
}

function crearOrdenIntentos({ proveedor = '', modo = '', opciones = {} } = {}) {
  const config = obtenerConfigIAPlan(opciones);
  const preferido = texto(proveedor || config.proveedorPreferido, 'automatico');
  if (preferido && preferido !== 'automatico' && EJECUTORES[preferido]) return ordenarSinDuplicados([preferido, 'fallback']);
  if (modo === 'manual' && preferido !== 'automatico') return ordenarSinDuplicados([preferido, 'fallback']);
  return ordenarSinDuplicados(ORDEN_AUTO_IA_PLAN);
}

export async function ejecutarProveedorIAPlan({ proveedor = 'fallback', contextoPlan = {}, opciones = {} } = {}) {
  const ejecutor = EJECUTORES[proveedor];
  if (!ejecutor) throw new Error(`Proveedor IA no soportado: ${proveedor}`);
  return ejecutor(contextoPlan, opciones);
}

export async function ejecutarPlanConIA({ contextoPlan = {}, proveedor = '', modo = 'automatico', opciones = {} } = {}) {
  const intentos = crearOrdenIntentos({ proveedor, modo, opciones });
  const errores = [];

  for (const id of intentos) {
    try {
      const respuesta = await ejecutarProveedorIAPlan({ proveedor: id, contextoPlan, opciones });
      return {
        ok: true,
        proveedorSeleccionado: id,
        modo,
        respuesta,
        erroresPrevios: errores,
        fecha: new Date().toISOString()
      };
    } catch (error) {
      errores.push({ proveedor: id, mensaje: error.message });
    }
  }

  const fallback = await ejecutarFallbackPlan(contextoPlan, { ...opciones, motivo: 'Todos los proveedores IA fallaron.' });
  return {
    ok: true,
    proveedorSeleccionado: 'fallback',
    modo,
    respuesta: fallback,
    erroresPrevios: errores,
    fecha: new Date().toISOString()
  };
}

async function intentarPrimeroDisponible(listaProveedores = [], contextoPlan = {}, opciones = {}) {
  const errores = [];
  for (const proveedor of listaProveedores) {
    try {
      return { proveedor, respuesta: await ejecutarProveedorIAPlan({ proveedor, contextoPlan, opciones }), errores };
    } catch (error) {
      errores.push({ proveedor, mensaje: error.message });
    }
  }
  return { proveedor: 'fallback', respuesta: await ejecutarFallbackPlan(contextoPlan, { ...opciones, motivo: 'No hubo IA local disponible.' }), errores };
}

export async function generarDosOpcionesIAPlan({ contextoPlan = {}, opciones = {} } = {}) {
  const opcionGemini = await intentarPrimeroDisponible(['gemini'], contextoPlan, opciones);
  const opcionLocal = await intentarPrimeroDisponible(PROVEEDORES_LOCALES_IA_PLAN, contextoPlan, opciones);
  const opcionesPlan = [
    { id: 'opcion-gemini', familia: 'remota-gratis', proveedor: opcionGemini.proveedor, respuesta: opcionGemini.respuesta, errores: opcionGemini.errores },
    { id: 'opcion-local', familia: 'local-gratis', proveedor: opcionLocal.proveedor, respuesta: opcionLocal.respuesta, errores: opcionLocal.errores }
  ];

  const mejor = opcionesPlan
    .map((opcion) => ({
      ...opcion,
      puntaje: (opcion.respuesta?.validacion?.ok ? 50 : 0)
        + (opcion.respuesta?.real ? 30 : 5)
        + (Array.isArray(opcion.respuesta?.jsonTecnico?.timeline) ? Math.min(opcion.respuesta.jsonTecnico.timeline.length, 20) : 0)
        + (opcion.proveedor === 'gemini' ? 5 : 0)
    }))
    .sort((a, b) => b.puntaje - a.puntaje)[0];

  return {
    ok: true,
    tipo: 'dos-opciones-ia-plan',
    opciones: opcionesPlan,
    seleccionAutomatica: {
      activa: true,
      mejorId: mejor?.id || 'opcion-local',
      proveedor: mejor?.proveedor || 'fallback',
      puntaje: mejor?.puntaje || 0
    },
    diagnostico: diagnosticarProveedoresIAPlan(opciones),
    creadoEn: new Date().toISOString()
  };
}
