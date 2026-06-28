/*
  Bloque 12 AutoVideoJeff
  Función: cierre final, optimización y limpieza segura del flujo multivideo.
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { auditarTemporalesMultivideo } from './limpiar-temporales-multivideo.js';
import { verificarBloque10Multivideo } from './verificar-multivideo-flujo-completo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ = path.resolve(__dirname, '..');

function leer(rutaRelativa) {
  return fs.readFileSync(path.join(RAIZ, rutaRelativa), 'utf8');
}

function exigirTokens({ ruta, tokens }) {
  const contenido = leer(ruta);
  const faltantes = tokens.filter((token) => !contenido.includes(token));
  if (faltantes.length) {
    throw new Error(`${ruta} no contiene tokens de cierre esperados: ${faltantes.join(', ')}`);
  }
  console.log(`OK ${ruta}: cierre verificado.`);
}

console.log('=== Bloque 12: Optimización y limpieza final multivideo ===');

exigirTokens({
  ruta: 'scripts/limpiar-temporales-multivideo.js',
  tokens: [
    'auditarTemporalesMultivideo',
    'clips-estandarizados-fallback',
    'requiereMaestro',
    'resultadoFinalExiste',
    '--aplicar',
    'bytesLiberables'
  ]
});

exigirTokens({
  ruta: 'etapas/03-produccion/unir-videos-maestro.service.js',
  tokens: [
    'fallback-estandarizado-concat-demuxer',
    'clipsEstandarizados',
    'fallbackAplicado'
  ]
});

const reporteAuditoria = await verificarBloque10Multivideo();
const reporteLimpieza = auditarTemporalesMultivideo({ aplicar: false });

console.log('\n--- Limpieza segura pendiente ---');
console.log(`Proyectos revisados: ${reporteLimpieza.resumen.proyectosRevisados}`);
console.log(`Candidatos: ${reporteLimpieza.resumen.candidatos}`);
console.log(`Eliminables: ${reporteLimpieza.resumen.eliminables}`);
console.log(`Espacio liberable: ${reporteLimpieza.resumen.bytesLiberables} bytes`);

if (reporteAuditoria.errores > 0) {
  console.error('ERROR Bloque 12 AutoVideoJeff: existen errores críticos previos en la auditoría multivideo.');
  process.exitCode = 1;
} else {
  console.log('OK Bloque 12 AutoVideoJeff: optimización y limpieza final listas.');
  console.log('Para aplicar limpieza segura: node scripts/limpiar-temporales-multivideo.js --aplicar');
}
