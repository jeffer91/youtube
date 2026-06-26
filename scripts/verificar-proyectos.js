/*
  Verificacion Bloque 1: modulo proyectos.
*/

import { crearProyecto, cargarProyecto, listarProyectos } from '../proyectos/proyectos.conexion.js';

async function main() {
  const id = `verificacion-bloque1-${Date.now()}`;
  const proyecto = await crearProyecto({
    id,
    nombre: 'Verificacion Bloque 1',
    perfil: 'general',
    plataformas: ['tiktok', 'youtube']
  });

  const cargado = await cargarProyecto(proyecto.id);
  const lista = await listarProyectos();

  if (cargado.id !== proyecto.id) throw new Error('El proyecto cargado no coincide con el creado.');
  if (!lista.some((item) => item.id === proyecto.id)) throw new Error('El proyecto creado no aparece en el listado.');

  console.log('OK proyectos:', proyecto.id);
}

main().catch((error) => {
  console.error('ERROR proyectos:', error.message);
  process.exit(1);
});
