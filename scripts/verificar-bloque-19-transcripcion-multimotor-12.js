import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'scripts/probar-flujo-transcripcion-multimotor-real.js',
  'docs/bloque-19-transcripcion-multimotor-12.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.12 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const prueba = leer('scripts/probar-flujo-transcripcion-multimotor-real.js');
const doc = leer('docs/bloque-19-transcripcion-multimotor-12.md');

const validaciones = [
  ['script usa proyectoId real', prueba.includes('AUTOVIDEOJEFF_PROYECTO_ID') && prueba.includes('--proyecto-id')],
  ['script usa URL base local', prueba.includes('AUTOVIDEOJEFF_BASE_URL') && prueba.includes('--base-url')],
  ['script llama diagnóstico', prueba.includes('/api/autovideo/transcripcion/motores/diagnostico')],
  ['script llama instalación', prueba.includes('/api/autovideo/transcripcion/motores/instalacion')],
  ['script procesa entendimiento', prueba.includes('/entendimiento/procesar')],
  ['script carga entendimiento', prueba.includes('/entendimiento')],
  ['script prueba selección principal', prueba.includes('/transcripciones/') && prueba.includes('/usar')],
  ['script valida archivos esperados', prueba.includes('transcripcion-principal.json') && prueba.includes('resumen-motores.json') && prueba.includes('audio-motores.wav')],
  ['script guarda reporte final', prueba.includes('prueba-completa-bloque-19-12.json')],
  ['script emite OK final', prueba.includes('Bloque 19.12 OK')],
  ['documentación incluye flujo completo', doc.includes('Nuevo proyecto') && doc.includes('Procesar entendimiento') && doc.includes('Elegir principal')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.12 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.12 OK: prueba completa con video real preparada.');
