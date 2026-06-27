import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'transcripcion/motores/whisper-cpp/whisper-cpp.service.js',
  'docs/bloque-19-transcripcion-multimotor-04.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.4 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const servicio = leer('transcripcion/motores/whisper-cpp/whisper-cpp.service.js');
const validaciones = [
  ['servicio exporta transcribirConWhisperCpp', servicio.includes('export async function transcribirConWhisperCpp')],
  ['servicio exporta verificarWhisperCpp', servicio.includes('export async function verificarWhisperCpp')],
  ['servicio usa audio único de motores', servicio.includes('prepararAudioMotoresTranscripcion') && servicio.includes('crearFuenteAudioParaMotor')],
  ['servicio normaliza resultado', servicio.includes('crearTranscripcionNormalizadaMotor') && servicio.includes('crearResultadoMotorTranscripcion')],
  ['servicio ejecuta binario', servicio.includes('spawn') && servicio.includes('resolverEjecutableWhisperCpp')],
  ['servicio exige modelo', servicio.includes('AUTOVIDEOJEFF_WHISPER_CPP_MODEL') && servicio.includes('resolverModeloWhisperCpp')],
  ['servicio solicita JSON y TXT', servicio.includes("'-oj'") && servicio.includes("'-otxt'")],
  ['servicio parsea JSON whisper.cpp', servicio.includes('normalizarSegmentosDesdeJsonWhisperCpp')],
  ['servicio tiene fallback TXT', servicio.includes('normalizarSegmentosDesdeTxt')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.4 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.4 OK: adaptador whisper.cpp listo.');
