import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'transcripcion/motores/vosk/vosk.service.js',
  'transcripcion/motores/vosk/vosk_runner.py',
  'docs/bloque-19-transcripcion-multimotor-05.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.5 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const servicio = leer('transcripcion/motores/vosk/vosk.service.js');
const runner = leer('transcripcion/motores/vosk/vosk_runner.py');

const validaciones = [
  ['servicio exporta transcribirConVosk', servicio.includes('export async function transcribirConVosk')],
  ['servicio exporta verificarVosk', servicio.includes('export async function verificarVosk')],
  ['servicio usa audio único de motores', servicio.includes('prepararAudioMotoresTranscripcion') && servicio.includes('crearFuenteAudioParaMotor')],
  ['servicio normaliza resultado', servicio.includes('crearTranscripcionNormalizadaMotor') && servicio.includes('crearResultadoMotorTranscripcion')],
  ['servicio ejecuta runner Python', servicio.includes('vosk_runner.py') && servicio.includes('spawn')],
  ['servicio exige modelo Vosk', servicio.includes('AUTOVIDEOJEFF_VOSK_MODEL') && servicio.includes('resolverModeloVosk')],
  ['runner importa Vosk', runner.includes('from vosk import Model, KaldiRecognizer')],
  ['runner valida WAV', runner.includes('wave.open') && runner.includes('getnchannels')],
  ['runner devuelve texto y segmentos', runner.includes('textoCompleto') && runner.includes('segmentos')],
  ['runner maneja instalación faltante', runner.includes('pip install vosk')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.5 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.5 OK: adaptador Vosk listo.');
