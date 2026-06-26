/* Verificacion Bloque 4: biblioteca general. */

import {
  clasificarRecurso,
  validarRecursoModelo,
  validarLicenciaRecurso,
  listarCategoriasBiblioteca
} from '../biblioteca/biblioteca.conexion.js';

function main() {
  const categorias = listarCategoriasBiblioteca();
  const recurso = clasificarRecurso({
    nombre: 'Estadio de prueba',
    tipo: 'imagen',
    perfil: '11-contra-11',
    tema: 'futbol',
    ruta: 'biblioteca/recursos/futbol/estadio.jpg',
    fuente: 'propio',
    licencia: 'propio'
  });

  const validacion = validarRecursoModelo(recurso);
  const licencia = validarLicenciaRecurso(recurso);

  if (categorias.length < 7) throw new Error('Faltan categorias de biblioteca.');
  if (!validacion.ok) throw new Error(validacion.errores.join(' | '));
  if (!licencia.seguroParaExportar) throw new Error('La licencia de prueba no quedo segura.');

  console.log('OK biblioteca:', recurso.nombre, recurso.categoria);
}

try {
  main();
} catch (error) {
  console.error('ERROR biblioteca:', error.message);
  process.exit(1);
}
