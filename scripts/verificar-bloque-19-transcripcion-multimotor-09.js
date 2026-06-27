import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'transcripcion/motores/diagnostico-motores-transcripcion.service.js',
  'server/rutas-modulares.service.js',
  'app/pantallas/entendimiento.view.js',
  'app/etapas-ui/entendimiento-ui.js',
  'app/entendimiento.css',
  'docs/bloque-19-transcripcion-multimotor-09.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.9 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const servicio = leer('transcripcion/motores/diagnostico-motores-transcripcion.service.js');
const rutas = leer('server/rutas-modulares.service.js');
const vista = leer('app/pantallas/entendimiento.view.js');
const ui = leer('app/etapas-ui/entendimiento-ui.js');
const css = leer('app/entendimiento.css');

const validaciones = [
  ['servicio exporta diagnosticarMotoresTranscripcion', servicio.includes('export async function diagnosticarMotoresTranscripcion')],
  ['servicio usa verificarMotoresTranscripcion', servicio.includes('verificarMotoresTranscripcion')],
  ['servicio detecta Python', servicio.includes('AUTOVIDEOJEFF_PYTHON')],
  ['servicio detecta whisper.cpp modelo', servicio.includes('AUTOVIDEOJEFF_WHISPER_CPP_MODEL')],
  ['servicio detecta Vosk modelo', servicio.includes('AUTOVIDEOJEFF_VOSK_MODEL')],
  ['servicio genera acciones', servicio.includes('acciones') && servicio.includes('pip install faster-whisper') && servicio.includes('pip install vosk')],
  ['ruta API de diagnóstico registrada', rutas.includes('/api/autovideo/transcripcion/motores/diagnostico')],
  ['vista tiene botón diagnosticar motores', vista.includes('entendimientoDiagnosticarMotoresBtn')],
  ['vista tiene panel diagnóstico', vista.includes('entendimientoDiagnosticoMotores')],
  ['UI llama endpoint diagnóstico', ui.includes('/api/autovideo/transcripcion/motores/diagnostico')],
  ['UI renderiza diagnóstico motores', ui.includes('renderDiagnosticoMotores')],
  ['UI enlaza botón diagnóstico', ui.includes('entendimientoDiagnosticarMotoresBtn')],
  ['CSS estiliza diagnóstico', css.includes('entendimiento-diagnostico-motores') && css.includes('entendimiento-diagnostico-card')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.9 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.9 OK: diagnóstico de motores instalado y visible en Entendimiento.');
