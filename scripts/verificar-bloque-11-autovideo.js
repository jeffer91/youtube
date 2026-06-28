/*
  Bloque 11 AutoVideoJeff
  Función: validar correcciones preventivas del flujo multivideo después de la auditoría completa.
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verificarBloque10Multivideo } from './verificar-multivideo-flujo-completo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ = path.resolve(__dirname, '..');

function leer(rutaRelativa) {
  return fs.readFileSync(path.join(RAIZ, rutaRelativa), 'utf8');
}

function verificarTokens({ ruta, tokens }) {
  const contenido = leer(ruta);
  const faltantes = tokens.filter((token) => !contenido.includes(token));
  if (faltantes.length) {
    throw new Error(`${ruta} no contiene correcciones esperadas: ${faltantes.join(', ')}`);
  }
  console.log(`OK ${ruta}: correcciones verificadas.`);
}

console.log('=== Bloque 11: Correcciones preventivas multivideo ===');

verificarTokens({
  ruta: 'etapas/03-produccion/unir-videos-maestro.service.js',
  tokens: [
    'ejecutarUnionConFallback',
    'clips-estandarizados',
    'fallback-estandarizado-concat-demuxer',
    'errorPrimario',
    'objetivoEstandarizacion',
    'fallbackAplicado'
  ]
});

verificarTokens({
  ruta: 'scripts/verificar-multivideo-flujo-completo.js',
  tokens: [
    'videos-originales.json',
    'línea de tiempo multivideo',
    'entendimiento global',
    'Resultado final marcado como multivideo'
  ]
});

const reporte = await verificarBloque10Multivideo();

if (reporte.errores > 0) {
  console.error('ERROR Bloque 11 AutoVideoJeff: primero corrige los errores críticos reportados por Bloque 10.');
  process.exitCode = 1;
} else {
  console.log('OK Bloque 11 AutoVideoJeff: correcciones preventivas multivideo listas.');
}
