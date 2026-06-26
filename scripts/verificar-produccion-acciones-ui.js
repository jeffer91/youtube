/* Verificacion Bloque 15: acciones de revision de Produccion. */

import fs from 'fs';
import { renderProduccionView } from '../app/pantallas/produccion.view.js';
import { renderProduccionRevision } from '../app/produccion-revision-ui.js';

function main() {
  const plan = {
    elementos: [
      { id: 'el-1', tipo: 'texto', nombre: 'Titulo inicial', descripcion: 'Texto en pantalla' },
      { id: 'el-2', tipo: 'audio', nombre: 'Plan de audio', descripcion: 'Elemento sonoro', aprobado: true }
    ]
  };

  const vista = renderProduccionView();
  const lista = renderProduccionRevision(plan);
  const ui = fs.readFileSync('app/produccion-revision-ui.js', 'utf-8');
  const css = fs.readFileSync('app/produccion-revision.css', 'utf-8');

  if (!vista.includes('data-production-action="save"')) throw new Error('La vista no tiene boton guardar.');
  if (!lista.includes('data-production-mark="aprobar"')) throw new Error('Falta accion aprobar.');
  if (!lista.includes('data-production-mark="no-usar"')) throw new Error('Falta accion no usar.');
  if (!lista.includes('data-production-mark="pendiente"')) throw new Error('Falta accion pendiente.');
  if (!ui.includes('aplicarMarcaProduccionUI') || !ui.includes('guardarPlanActual')) throw new Error('Faltan funciones de marcado o guardado.');
  if (!css.includes('production-card-actions')) throw new Error('Faltan estilos de acciones.');

  console.log('OK produccion acciones UI:', plan.elementos.length, 'elementos');
}

try {
  main();
} catch (error) {
  console.error('ERROR produccion acciones UI:', error.message);
  process.exit(1);
}
