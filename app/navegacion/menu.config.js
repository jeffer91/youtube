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
  { id: 'entendimiento', titulo: 'Entendimiento', descripcion: 'Transcripcion, fotogramas y analisis global', vista: 'entendimiento' },
  { id: 'diagnostico', titulo: 'Diagnostico', descripcion: 'Estado de modulos y errores', vista: 'diagnostico' }
]);

export const FLUJO_PROYECTO = Object.freeze([
  { id: 'nuevo-proyecto', titulo: 'Nuevo proyecto' },
  { id: 'entendimiento', titulo: 'Entendimiento' }
]);

export function normalizarPantallaMenu(id = 'inicio') {
  const pantallaId = ALIAS_PANTALLAS[id] || id;
  return MENU_PRINCIPAL.some((item) => item.id === pantallaId) ? pantallaId : 'inicio';
}

export function obtenerItemMenu(id = 'inicio') {
  const pantallaId = normalizarPantallaMenu(id);
  return MENU_PRINCIPAL.find((item) => item.id === pantallaId) || MENU_PRINCIPAL[0];
}
