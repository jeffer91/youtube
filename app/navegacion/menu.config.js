/*
  Modulo UI: navegacion
  Funcion: menu principal grande de AutoVideoJeff.
*/

export const MENU_PRINCIPAL = Object.freeze([
  { id: 'inicio', titulo: 'Inicio', descripcion: 'Resumen general de la app', vista: 'inicio' },
  { id: 'nuevo-proyecto', titulo: 'Nuevo proyecto', descripcion: 'Subir video y configurar edicion', vista: 'nuevo-proyecto' },
  { id: 'biblioteca', titulo: 'Biblioteca', descripcion: 'Recursos generales y categorias', vista: 'biblioteca' },
  { id: 'produccion', titulo: 'Produccion', descripcion: 'Revision, reemplazo y aprobacion', vista: 'produccion' },
  { id: 'historial', titulo: 'Historial', descripcion: 'Proyectos recientes y exportaciones', vista: 'historial' },
  { id: 'perfiles', titulo: 'Perfiles', descripcion: 'Estilos de edicion por marca', vista: 'perfiles' },
  { id: 'ajustes', titulo: 'Ajustes', descripcion: 'Gemini, rutas y preferencias', vista: 'ajustes' },
  { id: 'diagnostico', titulo: 'Diagnostico', descripcion: 'Estado de modulos y errores', vista: 'diagnostico' }
]);

export const FLUJO_PROYECTO = Object.freeze([
  { id: 'subida', titulo: 'Subida y configuracion' },
  { id: 'procesado', titulo: 'Procesado' },
  { id: 'produccion', titulo: 'Produccion' },
  { id: 'resultado', titulo: 'Resultado y comparativa' }
]);

export function obtenerItemMenu(id = 'inicio') {
  return MENU_PRINCIPAL.find((item) => item.id === id) || MENU_PRINCIPAL[0];
}
