import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'transcripcion/servicios/preparar-audio-motores.service.js',
  'docs/bloque-19-transcripcion-multimotor-02.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.2 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const servicio = leer('transcripcion/servicios/preparar-audio-motores.service.js');
const validaciones = [
  ['exporta prepararAudioMotoresTranscripcion', servicio.includes('export async function prepararAudioMotoresTranscripcion')],
  ['define WAV', servicio.includes("formato: 'wav'")],
  ['define codec pcm_s16le', servicio.includes("codec: 'pcm_s16le'")],
  ['define 16000 Hz', servicio.includes('sampleRate: 16000')],
  ['define mono', servicio.includes('canales: 1')],
  ['usa FFmpeg', servicio.includes("from 'fluent-ffmpeg'") && servicio.includes("from 'ffmpeg-static'" )],
  ['crea metadata JSON', servicio.includes('audio-motores.json') && servicio.includes('escribirJson')],
  ['resuelve fuente original/mejorada', servicio.includes('resolverFuenteAudioMotoresTranscripcion') && servicio.includes('video-original') && servicio.includes('audio-mejorado')],
  ['permite reutilizar audio existente', servicio.includes('reutilizado') && servicio.includes('reutilizarAudioMotores')],
  ['crea fuente para motor', servicio.includes('crearFuenteAudioParaMotor')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.2 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.2 OK: preparación de audio único para motores lista.');
