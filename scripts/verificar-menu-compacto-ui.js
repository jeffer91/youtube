/* Verificacion correccion UI: menu superior compacto y sin descripciones visibles. */

import fs from 'fs';
import { renderizarMenuPrincipal } from '../app/navegacion/navegacion.service.js';

function crearContenedorMock() {
  return { innerHTML: '' };
}

function main() {
  const contenedor = crearContenedorMock();
  renderizarMenuPrincipal(contenedor, 'nuevo-proyecto');
  const html = contenedor.innerHTML;
  const css = fs.readFileSync('app/navegacion/navegacion.css', 'utf-8');
  const service = fs.readFileSync('app/navegacion/navegacion.service.js', 'utf-8');

  if (!html.includes('aj-main-menu')) throw new Error('No se renderiza menu principal.');
  if (html.includes('<small>')) throw new Error('El menu aun muestra descripciones visibles.');
  if (!html.includes('title=')) throw new Error('El menu debe conservar descripcion solo como ayuda title.');
  if (!css.includes('display:flex') || !css.includes('border-radius:999px')) throw new Error('El CSS no esta compacto tipo tabs.');
  if (!css.includes('.aj-menu-btn small{display:none!important}')) throw new Error('No se ocultaron descripciones del menu.');
  if (!service.includes('aria-label="Abrir')) throw new Error('Falta accesibilidad basica en botones compactos.');

  console.log('OK menu compacto UI: sin descripciones visibles y con botones tipo tabs');
}

try {
  main();
} catch (error) {
  console.error('ERROR menu compacto UI:', error.message);
  process.exit(1);
}
