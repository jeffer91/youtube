import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'entender/entender.conexion.js',
  'entender/etapas/entendimiento-etapa.service.js',
  'docs/bloque-19-transcripcion-multimotor-07.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.7 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const conexion = leer('entender/entender.conexion.js');
const etapa = leer('entender/etapas/entendimiento-etapa.service.js');

const validaciones = [
  ['Entendimiento importa gestor multimotor', conexion.includes('procesarTranscripcionMultimotor')],
  ['Entendimiento conserva transcripción simple/manual', conexion.includes('transcribirVideoSimple') && conexion.includes('tieneTextoTranscrito')],
  ['Entendimiento crea transcripciones por motor', conexion.includes('crearTranscripcionesPorMotorDesdeMultimotor')],
  ['Entendimiento expone transcripción principal', conexion.includes('transcripcionPrincipal')],
  ['Entendimiento expone resumen de transcripción', conexion.includes('resumenTranscripcion')],
  ['Entendimiento expone transcripciones por motor', conexion.includes('transcripcionesPorMotor')],
  ['Entendimiento mantiene fallback legacy', conexion.includes('intentarTranscripcionLegacy') && conexion.includes('procesarTranscripcion')],
  ['Resumen incluye motor principal', conexion.includes('motorTranscripcionPrincipal')],
  ['Etapa resume motor principal', etapa.includes('motorTranscripcionPrincipal')],
  ['Etapa resume transcripciones generadas', etapa.includes('transcripcionesGeneradas')],
  ['Metadata marca bloque 7', etapa.includes('bloque: 7') && etapa.includes('entendimiento-backend-multimotor')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.7 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.7 OK: Entendimiento conectado al gestor multimotor.');
