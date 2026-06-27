import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'transcripcion/modelos/transcripcion-normalizada.modelo.js',
  'transcripcion/motores/motores-transcripcion.config.js',
  'transcripcion/servicios/guardar-resultados-motores.service.js',
  'transcripcion/servicios/cargar-resultados-motores.service.js',
  'docs/bloque-19-transcripcion-multimotor-01.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.1 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const modelo = leer('transcripcion/modelos/transcripcion-normalizada.modelo.js');
const config = leer('transcripcion/motores/motores-transcripcion.config.js');
const guardar = leer('transcripcion/servicios/guardar-resultados-motores.service.js');
const cargar = leer('transcripcion/servicios/cargar-resultados-motores.service.js');

const validaciones = [
  ['modelo define faster-whisper', modelo.includes('FASTER_WHISPER') && modelo.includes('faster-whisper')],
  ['modelo define whisper.cpp', modelo.includes('WHISPER_CPP') && modelo.includes('whisper-cpp')],
  ['modelo define vosk', modelo.includes('VOSK') && modelo.includes('vosk')],
  ['modelo normaliza segmentos', modelo.includes('normalizarSegmentoTranscripcion')],
  ['modelo elige mejor resultado', modelo.includes('elegirMejorResultadoTranscripcion')],
  ['config define orden de motores', config.includes('ORDEN_MOTORES_TRANSCRIPCION')],
  ['config deja Gemini opcional', config.includes('cloud-opcional') && config.includes('activoPorDefecto: false')],
  ['guardado crea principal', guardar.includes('guardarTranscripcionPrincipal')],
  ['guardado crea resumen', guardar.includes('guardarResumenMotoresTranscripcion')],
  ['carga lee principal', cargar.includes('cargarTranscripcionPrincipal')],
  ['carga lee lote', cargar.includes('cargarResultadosMotoresTranscripcion')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.1 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.1 OK: base de transcripción multimotor lista.');
