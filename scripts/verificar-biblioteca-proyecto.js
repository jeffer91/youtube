/* Verificacion Bloque 4: biblioteca del proyecto. */

import { crearProyecto } from '../proyectos/proyectos.conexion.js';
import {
  guardarRecursoProyecto,
  listarRecursosProyecto,
  registrarRecursoUsado,
  reemplazarRecursoProyecto
} from '../biblioteca-proyecto/biblioteca-proyecto.conexion.js';

async function main() {
  const proyecto = await crearProyecto({ id: `biblioteca-proyecto-${Date.now()}`, nombre: 'Biblioteca proyecto prueba' });
  const recurso = await guardarRecursoProyecto(proyecto, {
    nombre: 'Imagen sugerida',
    tipo: 'imagen',
    ruta: 'biblioteca/imagen.jpg',
    fuente: 'propio',
    licencia: 'propio',
    tema: 'prueba'
  });

  await registrarRecursoUsado(proyecto, recurso, { inicio: 0, fin: 2, aprobado: true });
  const reemplazo = await reemplazarRecursoProyecto(proyecto, {
    recursoAnteriorId: recurso.id,
    motivo: 'Mejor imagen para la frase',
    nuevoRecurso: {
      nombre: 'Imagen correcta',
      tipo: 'imagen',
      ruta: 'biblioteca/correcta.jpg',
      fuente: 'propio',
      licencia: 'propio'
    }
  });

  const recursos = await listarRecursosProyecto(proyecto);
  if (recursos.length < 2) throw new Error('No se guardaron recursos del proyecto.');
  if (!reemplazo.nuevo.id) throw new Error('No se creo recurso de reemplazo.');

  console.log('OK biblioteca proyecto:', recursos.length, 'recursos');
}

main().catch((error) => {
  console.error('ERROR biblioteca proyecto:', error.message);
  process.exit(1);
});
