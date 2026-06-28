/*
  Modulo: produccion
  Funcion: modelo base del plan revisable de Produccion.
*/

import { PRODUCCION_CONFIG } from './produccion.config.js';
import { crearLineaTiempoProduccion } from './linea-tiempo-produccion.service.js';

export function crearIdProduccion(prefijo = 'produccion') {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function crearElementoProduccion(datos = {}) {
  return {
    id: datos.id || crearIdProduccion('elemento'),
    tipo: datos.tipo || PRODUCCION_CONFIG.tiposElemento.recurso,
    nombre: datos.nombre || datos.titulo || 'Elemento de produccion',
    descripcion: datos.descripcion || '',
    estado: datos.estado || PRODUCCION_CONFIG.estados.enRevision,
    origen: datos.origen || 'automatico',
    perfil: datos.perfil || null,
    plataforma: datos.plataforma || null,
    pista: datos.pista || null,
    inicio: datos.inicio ?? null,
    fin: datos.fin ?? null,
    visible: datos.visible !== false,
    bloqueado: datos.bloqueado === true,
    datos: datos.datos || {},
    recurso: datos.recurso || null,
    aprobado: datos.aprobado === true,
    rechazado: datos.rechazado === true,
    reemplazado: datos.reemplazado === true,
    reemplazo: datos.reemplazo || null,
    comentario: datos.comentario || '',
    creadoEn: datos.creadoEn || new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

export function crearPlanProduccionModelo(datos = {}) {
  const elementos = Array.isArray(datos.elementos) ? datos.elementos.map(crearElementoProduccion) : [];
  const duracionSegundos = Number(datos.duracionSegundos || datos.duracion || 0) || 0;
  const lineaTiempo = datos.lineaTiempo || crearLineaTiempoProduccion({ elementos, duracionSegundos });
  const planEjecutable = datos.planEjecutable || null;
  return {
    id: datos.id || crearIdProduccion('plan'),
    proyectoId: datos.proyectoId || datos.proyecto?.id || null,
    perfil: datos.perfil || datos.proyecto?.perfil || 'general',
    modo: datos.modo || PRODUCCION_CONFIG.modos.revisionCompleta,
    estado: datos.estado || PRODUCCION_CONFIG.estados.borrador,
    resumen: datos.resumen || '',
    duracionSegundos,
    elementos,
    lineaTiempo,
    planEjecutable,
    usaPlanEjecutable: Boolean(planEjecutable?.tipo === 'plan-ejecutable-produccion'),
    aprobados: elementos.filter((item) => item.aprobado).length,
    pendientes: elementos.filter((item) => !item.aprobado && !item.rechazado).length,
    rechazados: elementos.filter((item) => item.rechazado).length,
    historial: datos.historial || [],
    creadoEn: datos.creadoEn || new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
}

export function validarPlanProduccion(plan = {}) {
  const errores = [];
  if (!plan.id) errores.push('El plan de produccion no tiene id.');
  if (!plan.proyectoId) errores.push('El plan de produccion no tiene proyecto asociado.');
  if (!Array.isArray(plan.elementos)) errores.push('El plan de produccion debe tener lista de elementos.');
  if (!plan.lineaTiempo) errores.push('El plan de produccion debe tener linea de tiempo.');
  if (plan.planEjecutable && plan.planEjecutable.tipo !== 'plan-ejecutable-produccion') errores.push('El plan ejecutable de produccion tiene tipo incorrecto.');
  return { ok: errores.length === 0, errores, plan };
}
