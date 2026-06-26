/* Verificacion Bloque 6: Produccion. */

import {
  crearPlanProduccion,
  aprobarElementoProduccion,
  rechazarElementoProduccion,
  reemplazarRecursoProduccion,
  aprobarProduccionFinal,
  calcularEstadoProduccion
} from '../produccion/produccion.conexion.js';

function aprobarTodo(plan) {
  return plan.elementos.reduce((actual, elemento) => aprobarElementoProduccion(actual, elemento.id, 'OK'), plan);
}

function main() {
  const proyecto = { id: 'produccion-prueba', perfil: 'general', modoEdicion: 'revision_completa' };
  const planBase = crearPlanProduccion({
    proyecto,
    recursos: [{ id: 'rec-1', nombre: 'Imagen inicial', tipo: 'imagen', ruta: 'biblioteca/a.jpg' }],
    subtitulos: [{ id: 'sub-1', texto: 'Subtitulo prueba', inicio: 0, fin: 2 }],
    textos: [{ id: 'txt-1', texto: 'Texto prueba', inicio: 1, fin: 3 }]
  });

  if (planBase.elementos.length < 3) throw new Error('No se crearon elementos de produccion.');

  const conObservacion = rechazarElementoProduccion(planBase, 'rec-1', 'Cambiar recurso');
  const conReemplazo = reemplazarRecursoProduccion(conObservacion, {
    elementoId: 'rec-1',
    motivo: 'Mejor recurso visual',
    nuevoRecurso: { id: 'rec-2', nombre: 'Imagen mejorada', tipo: 'imagen', ruta: 'biblioteca/b.jpg' }
  });

  const aprobado = aprobarTodo(conReemplazo);
  const estado = calcularEstadoProduccion(aprobado);
  if (!estado.listoExportar) throw new Error('El plan no quedo listo para exportar.');
  const final = aprobarProduccionFinal(aprobado, 'Aprobado para exportar');
  if (final.estado !== 'listo_exportar') throw new Error('No se aprobo la produccion final.');

  console.log('OK Produccion:', final.elementos.length, 'elementos');
}

try {
  main();
} catch (error) {
  console.error('ERROR Produccion:', error.message);
  process.exit(1);
}
