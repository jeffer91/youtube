/*
  Modulo UI: navegacion
  Funcion: menu principal de AutoVideoJeff organizado por flujo de etapas.
*/

export const MENU_PRINCIPAL = Object.freeze([
  { id: 'inicio', titulo: 'Inicio', descripcion: 'Resumen general de la app', vista: 'inicio' },
  { id: 'nuevo-proyecto', titulo: 'Nuevo proyecto', descripcion: 'Nombre, videos y primer procesamiento', vista: 'nuevo-proyecto' },
  { id: 'entendimiento', titulo: 'Entendimiento', descripcion: 'Transcripción, fotogramas y análisis global', vista: 'entendimiento' },
  { id: 'plan-edicion', titulo: 'Plan de edición', descripcion: 'Subtítulos, textos, recursos, efectos y timeline', vista: 'plan-edicion' },
  { id: 'biblioteca', titulo: 'Biblioteca', descripcion: 'Recursos generales y categorias', vista: 'biblioteca' },
  { id: 'produccion', titulo: 'Producción maestro', descripcion: 'Render maestro, auditoría, preview y antes/después', vista: 'produccion' },
  { id: 'adaptacion', titulo: 'Adaptación', descripcion: 'Versiones finales para TikTok, Reels, Shorts y YouTube', vista: 'adaptacion' },
  { id: 'historial', titulo: 'Historial', descripcion: 'Proyectos recientes y exportaciones', vista: 'historial' },
  { id: 'perfiles', titulo: 'Perfiles', descripcion: 'Estilos de edicion por marca', vista: 'perfiles' },
  { id: 'ajustes', titulo: 'Ajustes', descripcion: 'Gemini, rutas y preferencias', vista: 'ajustes' },
  { id: 'diagnostico', titulo: 'Diagnostico', descripcion: 'Estado de modulos y errores', vista: 'diagnostico' }
]);

export const FLUJO_PROYECTO = Object.freeze([
  { id: 'nuevo-proyecto', titulo: 'Nuevo proyecto' },
  { id: 'entendimiento', titulo: 'Entendimiento' },
  { id: 'plan-edicion', titulo: 'Plan de edición' },
  { id: 'produccion', titulo: 'Producción maestro' },
  { id: 'adaptacion', titulo: 'Adaptación' },
  { id: 'resultado', titulo: 'Resultado final' }
]);

export function obtenerItemMenu(id = 'inicio') {
  return MENU_PRINCIPAL.find((item) => item.id === id) || MENU_PRINCIPAL[0];
}
