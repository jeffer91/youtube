/* Verificacion Bloque 12: configuracion real de proyecto desde UI. */

import { normalizarConfiguracionProyecto, PERFILES_UI, PLATAFORMAS_UI } from '../app/configuracion-proyecto-ui.js';
import fs from 'fs';

function main() {
  const config = normalizarConfiguracionProyecto({
    perfil: 'jeff-verso',
    plataformas: ['tiktok', 'youtube', 'instagram'],
    modoEdicion: 'revision_completa',
    exportarMultiplataforma: true
  });

  if (PERFILES_UI.length !== 7) throw new Error('Deben existir 7 perfiles UI.');
  if (PLATAFORMAS_UI.length < 5) throw new Error('Deben existir plataformas UI suficientes.');
  if (config.perfil !== 'jeff-verso') throw new Error('No se respeta el perfil seleccionado.');
  if (config.plataforma !== 'tiktok') throw new Error('La plataforma principal debe ser la primera seleccionada.');
  if (config.plataformasTexto !== 'tiktok,youtube,instagram') throw new Error('No se serializan plataformas correctamente.');

  const index = fs.readFileSync('app/index.html', 'utf-8');
  const app = fs.readFileSync('app/app.js', 'utf-8');
  const server = fs.readFileSync('server.js', 'utf-8');

  if (!index.includes('profileSelect') || !index.includes('data-platform-option')) throw new Error('index.html no tiene selector de perfil/plataformas.');
  if (!app.includes('aplicarOpcionesProyectoAFormulario')) throw new Error('app.js no aplica configuracion de proyecto al formulario.');
  if (!server.includes('exportarMultiplataforma')) throw new Error('server.js no recibe exportarMultiplataforma.');

  console.log('OK configuracion proyecto UI:', config.perfil, config.plataformasTexto);
}

try {
  main();
} catch (error) {
  console.error('ERROR configuracion proyecto UI:', error.message);
  process.exit(1);
}
