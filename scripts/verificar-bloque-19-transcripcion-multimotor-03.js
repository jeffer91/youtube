import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'transcripcion/motores/faster-whisper/faster-whisper.service.js',
  'transcripcion/motores/faster-whisper/faster_whisper_runner.py',
  'docs/bloque-19-transcripcion-multimotor-03.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.3 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const servicio = leer('transcripcion/motores/faster-whisper/faster-whisper.service.js');
const runner = leer('transcripcion/motores/faster-whisper/faster_whisper_runner.py');

const validaciones = [
  ['servicio exporta transcribirConFasterWhisper', servicio.includes('export async function transcribirConFasterWhisper')],
  ['servicio exporta verificarFasterWhisper', servicio.includes('export async function verificarFasterWhisper')],
  ['servicio usa audio único de motores', servicio.includes('prepararAudioMotoresTranscripcion') && servicio.includes('crearFuenteAudioParaMotor')],
  ['servicio normaliza resultado', servicio.includes('crearTranscripcionNormalizadaMotor') && servicio.includes('crearResultadoMotorTranscripcion')],
  ['servicio ejecuta runner Python', servicio.includes('faster_whisper_runner.py') && servicio.includes('spawn')],
  ['runner importa faster_whisper', runner.includes('from faster_whisper import WhisperModel')],
  ['runner devuelve segmentos', runner.includes('segmentos') && runner.includes('textoCompleto')],
  ['runner maneja instalación faltante', runner.includes('pip install faster-whisper')],
  ['runner acepta audio y output', runner.includes('--audio') && runner.includes('--output')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.3 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.3 OK: adaptador faster-whisper listo.');
