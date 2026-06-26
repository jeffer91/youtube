/*
  Verificacion Bloque 1: modulo perfiles.
*/

import { listarPerfiles, validarTodosLosPerfiles, obtenerPerfil } from '../perfiles/perfiles.conexion.js';

function main() {
  const perfiles = listarPerfiles();
  const validacion = validarTodosLosPerfiles();
  const general = obtenerPerfil('general');

  if (!validacion.ok) throw new Error(validacion.errores.join(' | '));
  if (perfiles.length !== 7) throw new Error(`Se esperaban 7 perfiles y se encontraron ${perfiles.length}.`);
  if (general.nombre !== 'General') throw new Error('No se pudo obtener el perfil General.');

  console.log('OK perfiles:', perfiles.map((perfil) => perfil.nombre).join(', '));
}

try {
  main();
} catch (error) {
  console.error('ERROR perfiles:', error.message);
  process.exit(1);
}
