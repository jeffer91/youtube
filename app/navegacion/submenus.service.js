/*
  Modulo UI: navegacion
  Funcion: submenus por pantalla principal.
*/

export const SUBMENUS = Object.freeze({
  produccion: [
    { id: 'pendientes', titulo: 'Pendientes' },
    { id: 'aprobados', titulo: 'Aprobados' },
    { id: 'reemplazos', titulo: 'Reemplazos' },
    { id: 'aprendizaje', titulo: 'Aprendizaje' }
  ],
  perfiles: [
    { id: '11-contra-11', titulo: '11 contra 11' },
    { id: 'jeff-isekai', titulo: 'Jeff Isekai' },
    { id: 'creciaula', titulo: 'Creciaula' },
    { id: 'general', titulo: 'General' },
    { id: 'institucional', titulo: 'Institucional' },
    { id: 'el-don-historia', titulo: 'El Don Historia' },
    { id: 'jeff-verso', titulo: 'Jeff Verso' }
  ]
});

export function obtenerSubmenu(pantallaId) {
  return SUBMENUS[pantallaId] || [];
}

export function renderizarSubmenu(pantallaId) {
  const items = obtenerSubmenu(pantallaId);
  if (!items.length) return '';
  return `<div class="aj-submenu">${items.map((item) => `<button type="button" data-submenu="${item.id}">${item.titulo}</button>`).join('')}</div>`;
}
