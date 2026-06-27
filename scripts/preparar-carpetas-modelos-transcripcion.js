import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const carpetas = [
  'datos/modelos/transcripcion',
  'datos/modelos/transcripcion/faster-whisper',
  'datos/modelos/transcripcion/whisper-cpp',
  'datos/modelos/transcripcion/vosk',
  'datos/binarios/transcripcion',
  'datos/binarios/transcripcion/whisper-cpp'
];

for (const carpeta of carpetas) {
  const absoluta = path.join(raiz, carpeta);
  fs.mkdirSync(absoluta, { recursive: true });
  const keep = path.join(absoluta, '.gitkeep');
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, '', 'utf-8');
  console.log(`OK ${carpeta}`);
}

console.log('\nCarpetas de modelos/binarios preparadas.');
console.log('Siguiente: ejecuta el diagnóstico desde Entendimiento.');
