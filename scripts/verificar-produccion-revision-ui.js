/* Verificacion Bloque 14: revision de Produccion en UI. */

import fs from 'fs';
import { renderProduccionView } from '../app/pantallas/produccion.view.js';
import { renderProduccionRevision } from '../app/produccion-revision-ui.js';

function main() {
  const plan = {
    elementos: [
      { id: 'el-1', tipo: 'texto', nombre: 'Titulo inicial', descripcion: 'Texto en pantalla', inicio: 0, fin: 3 },
      { id: 'el-2', tipo: 'audio', nombre: 'Plan de audio', descripcion: 'Elemento sonoro', aprobado: true }
    ]
  };

  const vista = renderProduccionView();
  const lista = renderProduccionRevision(plan);
  const app = fs.readFileSync('app/app.js', 'utf-8');
  const ui = fs.readFileSync('app/produccion-revision-ui.js', 'utf-8');

  if (!vista.includes('productionReviewList') || !vista.includes('data-production-action')) throw new Error('Vista Produccion incompleta.');
  if (!lista.includes('Titulo inicial') || !lista.includes('Plan de audio')) throw new Error('Lista Produccion incompleta.');
  if (!app.includes('inicializarProduccionRevisionUI') || !app.includes('guardarUltimaProduccion')) throw new Error('Conexion app incompleta.');
  if (!ui.includes('productionProjectIdInput')) throw new Error('Entrada de proyecto no configurada.');

  console.log('OK produccion revision UI:', plan.elementos.length, 'elementos');
}

try {
  main();
} catch (error) {
  console.error('ERROR produccion revision UI:', error.message);
  process.exit(1);
}
