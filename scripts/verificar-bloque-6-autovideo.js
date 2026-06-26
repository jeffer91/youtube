/* Verificacion agrupada Bloque 6 AutoVideoJeff. */

import { crearPlanProduccion, aprobarElementoProduccion, aprobarProduccionFinal } from '../produccion/produccion.conexion.js';
import { aprenderDeReemplazo, obtenerReglasAplicables } from '../aprendizaje/aprendizaje.conexion.js';

function aprobarTodo(plan) {
  return plan.elementos.reduce((actual, elemento) => aprobarElementoProduccion(actual, elemento.id, 'OK'), plan);
}

async function main() {
  const proyecto = { id: `bloque6-${Date.now()}`, perfil: 'jeff-verso', modoEdicion: 'revision_completa' };
  const plan = crearPlanProduccion({
    proyecto,
    recursos: [{ id: 'rec-1', nombre: 'Fondo visual', tipo: 'imagen', tema: 'cine', fraseRelacionada: 'analisis' }],
    textos: [{ id: 'texto-1', texto: 'Analisis visual', inicio: 0, fin: 3 }],
    visual: { zooms: { zooms: [{ id: 'zoom-1', inicio: 0, fin: 2 }] } }
  });

  const aprobado = aprobarTodo(plan);
  const final = aprobarProduccionFinal(aprobado, 'Listo');
  if (final.estado !== 'listo_exportar') throw new Error('Produccion no quedo lista.');

  await aprenderDeReemplazo({
    perfil: proyecto.perfil,
    tema: 'cine',
    frase: 'analisis',
    recursoAnterior: { id: 'rec-1', tipo: 'imagen', nombre: 'Fondo visual' },
    recursoElegido: { id: 'rec-2', tipo: 'imagen', nombre: 'Fondo visual mejor' },
    motivo: 'Preferencia guardada desde produccion'
  });

  const reglas = await obtenerReglasAplicables({ perfil: proyecto.perfil, tema: 'cine', frase: 'analisis' });
  if (!reglas.length) throw new Error('No se encontro aprendizaje del reemplazo.');

  console.log('OK Bloque 6 AutoVideoJeff:', { elementos: final.elementos.length, reglas: reglas.length });
}

main().catch((error) => {
  console.error('ERROR Bloque 6 AutoVideoJeff:', error.message);
  process.exit(1);
});
