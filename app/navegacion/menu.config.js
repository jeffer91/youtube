/*
  Modulo UI: navegacion
  Funcion: menu principal de AutoVideoJeff organizado por flujo de etapas.
*/

const ALIAS_PANTALLAS = Object.freeze({
  'biblioteca-proyecto': 'biblioteca'
});

export const MENU_PRINCIPAL = Object.freeze([
  { id: 'inicio', titulo: 'Inicio', descripcion: 'Resumen general de la app', vista: 'inicio' },
  { id: 'nuevo-proyecto', titulo: 'Nuevo proyecto', descripcion: 'Nombre, videos y primer procesamiento', vista: 'nuevo-proyecto' },
  { id: 'entendimiento', titulo: 'Entendimiento', descripcion: 'Transcripción, fotogramas y análisis global', vista: 'entendimiento' },
  { id: 'biblioteca', titulo: 'Biblioteca', descripcion: 'Recursos generales y temporales del proyecto', vista: 'biblioteca' },
  { id: 'plan-edicion', titulo: 'Plan de edición', descripcion: 'Subtítulos, textos, recursos, efectos y timeline', vista: 'plan-edicion' },
  { id: 'laboratorio-efectos', titulo: 'Laboratorio', descripcion: 'Probar un solo efecto en un video corto', vista: 'laboratorio-efectos' },
  { id: 'produccion', titulo: 'Producción maestro', descripcion: 'Render maestro, auditoría, preview y antes/después', vista: 'produccion' },
  { id: 'adaptacion', titulo: 'Adaptación', descripcion: 'Versiones finales para TikTok, Reels, Shorts y YouTube', vista: 'adaptacion' },
  { id: 'resultado', titulo: 'Resultado final', descripcion: 'Paquete final, checklist y entregables de publicación', vista: 'resultado' },
  { id: 'historial', titulo: 'Historial', descripcion: 'Proyectos recientes y exportaciones', vista: 'historial' },
  { id: 'perfiles', titulo: 'Perfiles', descripcion: 'Estilos de edicion por marca', vista: 'perfiles' },
  { id: 'ajustes', titulo: 'Ajustes', descripcion: 'Gemini, rutas y preferencias', vista: 'ajustes' },
  { id: 'diagnostico', titulo: 'Diagnostico', descripcion: 'Estado de modulos y errores', vista: 'diagnostico' }
]);

export const FLUJO_PROYECTO = Object.freeze([
  { id: 'nuevo-proyecto', titulo: 'Nuevo proyecto' },
  { id: 'entendimiento', titulo: 'Entendimiento' },
  { id: 'biblioteca', titulo: 'Biblioteca' },
  { id: 'plan-edicion', titulo: 'Plan de edición' },
  { id: 'laboratorio-efectos', titulo: 'Laboratorio' },
  { id: 'produccion', titulo: 'Producción maestro' },
  { id: 'adaptacion', titulo: 'Adaptación' },
  { id: 'resultado', titulo: 'Resultado final' }
]);

export function normalizarPantallaMenu(id = 'inicio') {
  return ALIAS_PANTALLAS[id] || id;
}

export function obtenerItemMenu(id = 'inicio') {
  const pantallaId = normalizarPantallaMenu(id);
  return MENU_PRINCIPAL.find((item) => item.id === pantallaId) || MENU_PRINCIPAL[0];
}