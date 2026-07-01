/*
  Modulo UI: navegacion
  Funcion: menu principal de AutoVideoJeff organizado por flujo de etapas.
*/

import * as controlFuncionalidades from '../control/control-funcionalidades.js';

const ALIAS_PANTALLAS = Object.freeze({
  'biblioteca-proyecto': 'biblioteca'
});

const MENU_BASE = Object.freeze([
  { id: 'inicio', titulo: 'Inicio', descripcion: 'Resumen general de la app', vista: 'inicio' },
  { id: 'nuevo-proyecto', titulo: 'Nuevo proyecto', descripcion: 'Nombre, videos y primer procesamiento', vista: 'nuevo-proyecto' },
  { id: 'entendimiento', titulo: 'Entendimiento', descripcion: 'Transcripcion, fotogramas y analisis global', vista: 'entendimiento' },
  { id: 'biblioteca', titulo: 'Biblioteca', descripcion: 'Recursos generales y temporales del proyecto', vista: 'biblioteca' },
  { id: 'plan-edicion', titulo: 'Plan de edicion', descripcion: 'Subtitulos, textos, recursos, efectos y timeline', vista: 'plan-edicion' },
  { id: 'laboratorio-efectos', titulo: 'Laboratorio', descripcion: 'Probar un solo efecto en un video corto', vista: 'laboratorio-efectos' },
  { id: 'produccion', titulo: 'Produccion maestro', descripcion: 'Render maestro, auditoria, preview y antes/despues', vista: 'produccion' },
  { id: 'adaptacion', titulo: 'Adaptacion', descripcion: 'Versiones finales para TikTok, Reels, Shorts y YouTube', vista: 'adaptacion' },
  { id: 'resultado', titulo: 'Resultado final', descripcion: 'Paquete final, checklist y entregables de publicacion', vista: 'resultado' },
  { id: 'historial', titulo: 'Historial', descripcion: 'Proyectos recientes y exportaciones', vista: 'historial' },
  { id: 'perfiles', titulo: 'Perfiles', descripcion: 'Estilos de edicion por marca', vista: 'perfiles' },
  { id: 'ajustes', titulo: 'Ajustes', descripcion: 'Gemini, rutas y preferencias', vista: 'ajustes' },
  { id: 'diagnostico', titulo: 'Diagnostico', descripcion: 'Estado de modulos y errores', vista: 'diagnostico' }
]);

const FLUJO_BASE = Object.freeze([
  { id: 'nuevo-proyecto', titulo: 'Nuevo proyecto' },
  { id: 'entendimiento', titulo: 'Entendimiento' },
  { id: 'biblioteca', titulo: 'Biblioteca' },
  { id: 'plan-edicion', titulo: 'Plan de edicion' },
  { id: 'laboratorio-efectos', titulo: 'Laboratorio' },
  { id: 'produccion', titulo: 'Produccion maestro' },
  { id: 'adaptacion', titulo: 'Adaptacion' },
  { id: 'resultado', titulo: 'Resultado final' }
]);

export const MENU_PRINCIPAL = Object.freeze(controlFuncionalidades.filtrarPorFuncionalidadesActivas(MENU_BASE));
export const FLUJO_PROYECTO = Object.freeze(controlFuncionalidades.filtrarPorFuncionalidadesActivas(FLUJO_BASE));

export function normalizarPantallaMenu(id = 'inicio') {
  const pantallaId = ALIAS_PANTALLAS[id] || id;
  return controlFuncionalidades.funcionalidadActiva(pantallaId) ? pantallaId : 'inicio';
}

export function obtenerItemMenu(id = 'inicio') {
  const pantallaId = normalizarPantallaMenu(id);
  return MENU_PRINCIPAL.find((item) => item.id === pantallaId) || MENU_PRINCIPAL[0] || MENU_BASE[0];
}
