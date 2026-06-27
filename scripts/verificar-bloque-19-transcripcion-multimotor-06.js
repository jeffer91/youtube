import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'transcripcion/motores/gestor-motores-transcripcion.service.js',
  'docs/bloque-19-transcripcion-multimotor-06.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.6 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const gestor = leer('transcripcion/motores/gestor-motores-transcripcion.service.js');
const validaciones = [
  ['exporta procesarTranscripcionMultimotor', gestor.includes('export async function procesarTranscripcionMultimotor')],
  ['exporta verificarMotoresTranscripcion', gestor.includes('export async function verificarMotoresTranscripcion')],
  ['usa configuración multimotor', gestor.includes('obtenerConfigMultimotorTranscripcion')],
  ['prepara audio único', gestor.includes('prepararAudioMotoresTranscripcion')],
  ['ejecuta faster-whisper', gestor.includes('transcribirConFasterWhisper')],
  ['ejecuta whisper.cpp', gestor.includes('transcribirConWhisperCpp')],
  ['ejecuta Vosk', gestor.includes('transcribirConVosk')],
  ['maneja manual', gestor.includes('crearResultadoManual') && gestor.includes('textoTranscripcionManual')],
  ['elige mejor transcripción', gestor.includes('elegirMejorResultadoTranscripcion')],
  ['guarda lote de resultados', gestor.includes('guardarLoteResultadosTranscripcion')],
  ['no ejecuta Gemini obligatorio', gestor.includes('Gemini queda opcional')],
  ['contiene control de errores por motor', gestor.includes('crearResultadoError') && gestor.includes('try')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.6 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.6 OK: gestor multimotor listo.');
