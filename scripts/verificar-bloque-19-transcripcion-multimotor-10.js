import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'transcripcion/motores/instalacion-guiada-motores.service.js',
  'scripts/preparar-carpetas-modelos-transcripcion.js',
  'server/rutas-modulares.service.js',
  'app/pantallas/entendimiento.view.js',
  'app/etapas-ui/entendimiento-ui.js',
  'app/entendimiento.css',
  'docs/bloque-19-transcripcion-multimotor-10.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.10 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const servicio = leer('transcripcion/motores/instalacion-guiada-motores.service.js');
const script = leer('scripts/preparar-carpetas-modelos-transcripcion.js');
const rutas = leer('server/rutas-modulares.service.js');
const vista = leer('app/pantallas/entendimiento.view.js');
const ui = leer('app/etapas-ui/entendimiento-ui.js');
const css = leer('app/entendimiento.css');

const validaciones = [
  ['servicio exporta guía', servicio.includes('export function obtenerInstalacionGuiadaMotoresTranscripcion')],
  ['servicio incluye faster-whisper', servicio.includes('pip install faster-whisper')],
  ['servicio incluye whisper.cpp', servicio.includes('AUTOVIDEOJEFF_WHISPER_CPP_MODEL')],
  ['servicio incluye Vosk', servicio.includes('pip install vosk') && servicio.includes('AUTOVIDEOJEFF_VOSK_MODEL')],
  ['servicio define modo manual asistido', servicio.includes('guia-manual-asistida')],
  ['script prepara carpetas', script.includes('datos/modelos/transcripcion') && script.includes('datos/binarios/transcripcion')],
  ['ruta API instalación registrada', rutas.includes('/api/autovideo/transcripcion/motores/instalacion')],
  ['vista tiene botón guía instalación', vista.includes('entendimientoInstalarMotoresBtn')],
  ['vista tiene panel instalación', vista.includes('entendimientoInstalacionMotores')],
  ['UI llama endpoint instalación', ui.includes('/api/autovideo/transcripcion/motores/instalacion')],
  ['UI renderiza instalación', ui.includes('renderInstalacionMotores')],
  ['UI enlaza botón instalación', ui.includes('entendimientoInstalarMotoresBtn')],
  ['CSS estiliza instalación', css.includes('entendimiento-instalacion-motores') && css.includes('entendimiento-comandos')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.10 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.10 OK: instalación guiada de motores gratuitos disponible.');
