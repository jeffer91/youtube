/* Verificacion Opcion A bloque 1: procesador visible solo en Nuevo proyecto. */

import fs from 'fs';
import { renderInicioView } from '../app/pantallas/inicio.view.js';
import { renderNuevoProyectoView } from '../app/pantallas/nuevo-proyecto.view.js';

function main() {
  const index = fs.readFileSync('app/index.html', 'utf-8');
  const css = fs.readFileSync('app/styles.css', 'utf-8');
  const nav = fs.readFileSync('app/navegacion/navegacion.service.js', 'utf-8');
  const inicio = renderInicioView();
  const nuevo = renderNuevoProyectoView();

  if (!index.includes('id="nuevoProyectoProcessor"')) throw new Error('No existe panel del procesador.');
  if (!index.includes('data-screen-panel="nuevo-proyecto"')) throw new Error('El procesador no esta ligado a Nuevo proyecto.');
  if (!css.includes('.aj-screen-panel { display: none; }')) throw new Error('El procesador no se oculta por defecto.');
  if (!css.includes('body[data-pantalla-activa="nuevo-proyecto"]')) throw new Error('No existe regla para mostrar solo en Nuevo proyecto.');
  if (!nav.includes('document.body.dataset.pantallaActiva = item.id')) throw new Error('La navegacion no marca pantalla activa.');
  if (inicio.includes('videoForm') || inicio.includes('Seleccionar video')) throw new Error('Inicio no debe contener procesador de video.');
  if (!nuevo.includes('procesador principal')) throw new Error('Nuevo proyecto debe explicar que contiene el procesador.');

  console.log('OK Opcion A pantallas UI: procesador aislado en Nuevo proyecto');
}

try {
  main();
} catch (error) {
  console.error('ERROR Opcion A pantallas UI:', error.message);
  process.exit(1);
}
