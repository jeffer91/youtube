/* Verificacion Bloque 17: reemplazo y aprendizaje desde Produccion. */

import fs from 'fs';
import { renderProduccionRevision } from '../app/produccion-revision-ui.js';

function main() {
  const plan = {
    elementos: [
      { id: 'el-1', tipo: 'imagen', nombre: 'Imagen sugerida', descripcion: 'Recurso visual', recurso: { nombre: 'Imagen vieja' } }
    ]
  };
  const html = renderProduccionRevision(plan);
  const ui = fs.readFileSync('app/produccion-revision-ui.js', 'utf-8');
  const css = fs.readFileSync('app/produccion-revision.css', 'utf-8');

  if (!html.includes('data-production-replace')) throw new Error('No existe boton de reemplazo.');
  if (!html.includes('data-replace-field="nombre"')) throw new Error('No existe campo nombre de reemplazo.');
  if (!html.includes('data-replace-field="ruta"')) throw new Error('No existe campo ruta de reemplazo.');
  if (!html.includes('data-replace-field="url"')) throw new Error('No existe campo url de reemplazo.');
  if (!html.includes('data-replace-field="motivo"')) throw new Error('No existe campo motivo de aprendizaje.');
  if (!ui.includes('aplicarReemplazoProduccionUI')) throw new Error('No existe funcion aplicarReemplazoProduccionUI.');
  if (!ui.includes('/api/autovideo/aprendizaje')) throw new Error('No se registra aprendizaje en servidor.');
  if (!ui.includes('recursoRechazado') || !ui.includes('recursoElegido')) throw new Error('No se guarda comparacion de recursos.');
  if (!css.includes('production-replace-box')) throw new Error('Faltan estilos de reemplazo.');

  console.log('OK produccion reemplazo UI: reemplazo y aprendizaje conectados');
}

try {
  main();
} catch (error) {
  console.error('ERROR produccion reemplazo UI:', error.message);
  process.exit(1);
}
