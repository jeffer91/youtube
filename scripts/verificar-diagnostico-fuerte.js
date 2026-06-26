/* Verificacion Bloque 19: diagnostico fuerte y reintento. */

import fs from 'fs';
import { crearPlanReintento, normalizarEtapaError } from '../diagnostico/reintento-etapa.service.js';

function main() {
  const planAudio = crearPlanReintento({ etapa: 'audio', error: new Error('Fallo audio') });
  const planDiagnostico = crearPlanReintento({ etapa: 'diagnostico', detalle: 'Falta FFmpeg' });
  const etapa = normalizarEtapaError('[flujo-principal:salida] Error exportando');

  const fuerte = fs.readFileSync('diagnostico/diagnostico-fuerte.service.js', 'utf-8');
  const rutas = fs.readFileSync('server/rutas-modulares.service.js', 'utf-8');
  const modal = fs.readFileSync('app/error-modal.js', 'utf-8');
  const vista = fs.readFileSync('app/pantallas/diagnostico.view.js', 'utf-8');
  const nav = fs.readFileSync('app/navegacion/navegacion-bootstrap.js', 'utf-8');

  if (!planAudio.puedeReintentar || planAudio.etapa !== 'audio') throw new Error('Plan de reintento audio incorrecto.');
  if (planDiagnostico.puedeReintentar) throw new Error('Diagnostico no debe reintentarse sin corregir.');
  if (etapa !== 'salida') throw new Error('No normaliza etapa desde mensaje de error.');
  if (!fuerte.includes('crearDiagnosticoFuerte') || !fuerte.includes('packageJson')) throw new Error('Diagnostico fuerte incompleto.');
  if (!rutas.includes('/api/autovideo/diagnostico/fuerte') || !rutas.includes('/api/autovideo/reintento/plan')) throw new Error('Rutas de diagnostico/reintento no registradas.');
  if (!modal.includes('retryStageButton') || !modal.includes('requestSubmit')) throw new Error('Modal no permite reintentar etapa.');
  if (!vista.includes('strongDiagnosticResult')) throw new Error('Vista diagnostico fuerte incompleta.');
  if (!nav.includes('inicializarDiagnosticoFuerteUI')) throw new Error('Navegacion no inicializa diagnostico fuerte.');

  console.log('OK diagnostico fuerte y reintento:', planAudio.etapa, etapa);
}

try {
  main();
} catch (error) {
  console.error('ERROR diagnostico fuerte:', error.message);
  process.exit(1);
}
