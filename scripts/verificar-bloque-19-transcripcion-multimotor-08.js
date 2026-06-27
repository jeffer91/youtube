import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivos = [
  'app/pantallas/entendimiento.view.js',
  'app/etapas-ui/entendimiento-ui.js',
  'app/entendimiento.css',
  'docs/bloque-19-transcripcion-multimotor-08.md'
];

function existe(relativa) {
  return fs.existsSync(path.join(raiz, relativa));
}

function leer(relativa) {
  return fs.readFileSync(path.join(raiz, relativa), 'utf-8');
}

const faltantes = archivos.filter((archivo) => !existe(archivo));
if (faltantes.length) {
  console.error('Bloque 19.8 incompleto. Faltan archivos:');
  faltantes.forEach((archivo) => console.error(`- ${archivo}`));
  process.exit(1);
}

const vista = leer('app/pantallas/entendimiento.view.js');
const ui = leer('app/etapas-ui/entendimiento-ui.js');
const css = leer('app/entendimiento.css');

const validaciones = [
  ['vista incluye contenedor de tabs', vista.includes('entendimientoTranscripcionTabs')],
  ['vista incluye metadata de transcripción', vista.includes('entendimientoTranscripcionMeta')],
  ['vista incluye KPI motores', vista.includes('entendimientoMotores')],
  ['UI guarda último resultado', ui.includes('ultimoResultadoEntendimiento')],
  ['UI maneja transcripción activa', ui.includes('transcripcionActivaId')],
  ['UI crea opciones por motor', ui.includes('crearOpcionesTranscripcion')],
  ['UI normaliza items por motor', ui.includes('normalizarItemMotor')],
  ['UI renderiza tabs', ui.includes('renderTabsTranscripcion') && ui.includes('data-transcripcion-tab')],
  ['UI renderiza metadata de motor', ui.includes('renderMetaTranscripcion')],
  ['UI escucha click de tabs', ui.includes('manejarClickTranscripcion')],
  ['UI sigue renderizando texto y segmentos', ui.includes('renderDetalleTranscripcion') && ui.includes('segmentos.slice')],
  ['CSS estiliza tabs', css.includes('entendimiento-transcripcion-tabs') && css.includes('entendimiento-transcripcion-tab')],
  ['CSS estiliza metadata', css.includes('entendimiento-transcripcion-meta')]
];

const errores = validaciones.filter(([, ok]) => !ok).map(([nombre]) => nombre);
if (errores.length) {
  console.error('Bloque 19.8 con validaciones fallidas:');
  errores.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Bloque 19.8 OK: UI de Entendimiento muestra transcripciones por motor.');
