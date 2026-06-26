/* Verificacion agrupada Bloque 4 AutoVideoJeff. */

import { clasificarRecurso, validarRecursoModelo } from '../biblioteca/biblioteca.conexion.js';
import { prepararBusquedaImagenes, prepararDescargaRecurso } from '../recursos-externos/recursos-externos.conexion.js';
import { crearProyecto } from '../proyectos/proyectos.conexion.js';
import { guardarRecursoProyecto, listarRecursosProyecto } from '../biblioteca-proyecto/biblioteca-proyecto.conexion.js';

async function main() {
  const recurso = clasificarRecurso({
    nombre: 'Fondo aula moderna',
    tipo: 'imagen',
    perfil: 'creciaula',
    tema: 'educacion',
    ruta: 'biblioteca/recursos/educacion/aula.jpg',
    fuente: 'propio',
    licencia: 'propio'
  });
  const validacion = validarRecursoModelo(recurso);
  if (!validacion.ok) throw new Error(validacion.errores.join(' | '));

  const busqueda = prepararBusquedaImagenes({ tema: 'aula moderna', frase: 'explicar mejor', perfil: 'creciaula' });
  const descarga = prepararDescargaRecurso({ ...recurso, url: 'https://example.com/aula.jpg' });
  if (!busqueda.consulta || !descarga.nombreArchivo) throw new Error('No se preparo busqueda o descarga.');

  const proyecto = await crearProyecto({ id: `bloque4-${Date.now()}`, nombre: 'Bloque 4 prueba' });
  await guardarRecursoProyecto(proyecto, recurso);
  const recursosProyecto = await listarRecursosProyecto(proyecto);
  if (!recursosProyecto.length) throw new Error('No se guardo recurso en biblioteca del proyecto.');

  console.log('OK Bloque 4 AutoVideoJeff:', {
    recurso: recurso.nombre,
    categoria: recurso.categoria,
    consulta: busqueda.consulta,
    proyecto: proyecto.id
  });
}

main().catch((error) => {
  console.error('ERROR Bloque 4 AutoVideoJeff:', error.message);
  process.exit(1);
});
