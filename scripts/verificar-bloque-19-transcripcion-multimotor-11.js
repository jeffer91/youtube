import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'transcripcion/motores/seleccionar-transcripcion-principal.service.js',
  'server/rutas-modulares.service.js',
  'app/pantallas/entendimiento.view.js',
  'app/etapas-ui/entendimiento-ui.js',
  'app/entendimiento.css',
  'docs/bloque-19-transcripcion-multimotor-11.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.11 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const servicio = leer('transcripcion/motores/seleccionar-transcripcion-principal.service.js');
const rutas = leer('server/rutas-modulares.service.js');
const vista = leer('app/pantallas/entendimiento.view.js');
const ui = leer('app/etapas-ui/entendimiento-ui.js');
const css = leer('app/entendimiento.css');

const validaciones = [
  ['servicio exporta seleccionarTranscripcionPrincipalProyecto', servicio.includes('export async function seleccionarTranscripcionPrincipalProyecto')],
  ['servicio carga resultado por motor', servicio.includes('cargarResultadoMotorTranscripcion')],
  ['servicio guarda principal', servicio.includes('guardarTranscripcionPrincipal')],
  ['servicio actualiza resumen motores', servicio.includes('guardarResumenMotoresTranscripcion')],
  ['servicio guarda registro manual', servicio.includes('seleccion-manual.json')],
  ['servicio valida texto útil', servicio.includes('transcripcionTieneTextoUtil')],
  ['ruta API seleccionar principal registrada', rutas.includes('/api/proyectos/:proyectoId/transcripciones/:motor/usar')],
  ['ruta importa servicio selección', rutas.includes('seleccionarTranscripcionPrincipalProyecto')],
  ['vista tiene acciones de transcripción', vista.includes('entendimientoTranscripcionAcciones')],
  ['UI renderiza acciones', ui.includes('renderAccionesTranscripcion')],
  ['UI llama endpoint seleccionar principal', ui.includes('/transcripciones/') && ui.includes('/usar')],
  ['UI aplica principal local', ui.includes('aplicarPrincipalEnResultadoLocal')],
  ['UI escucha botón usar principal', ui.includes('data-usar-transcripcion-principal')],
  ['CSS estiliza acciones', css.includes('entendimiento-transcripcion-acciones')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.11 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.11 OK: selección manual de transcripción principal disponible.');
