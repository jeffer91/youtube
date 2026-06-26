/* Verificacion Bloque 10: estructura modular esperada. */

import fs from 'fs';
import path from 'path';

const CARPETAS = [
  'proyectos', 'perfiles', 'exportacion', 'audio', 'subtitulos', 'textos', 'visual',
  'biblioteca', 'biblioteca-proyecto', 'recursos-externos', 'gemini', 'produccion',
  'aprendizaje', 'server', 'app/navegacion', 'app/pantallas', 'app/controladores'
];

const ARCHIVOS = [
  'server.js',
  'motor/flujo-principal.js',
  'motor/flujo-modular-autovideo.service.js',
  'exportacion/resultado-plataformas.service.js',
  'app/resultado-plataformas-ui.js',
  'app/resultado-plataformas.css',
  'diagnostico/diagnostico-modular-autovideo.service.js'
];

function existe(ruta) {
  return fs.existsSync(path.join(process.cwd(), ruta));
}

function main() {
  const faltanCarpetas = CARPETAS.filter((ruta) => !existe(ruta));
  const faltanArchivos = ARCHIVOS.filter((ruta) => !existe(ruta));
  if (faltanCarpetas.length || faltanArchivos.length) {
    throw new Error(`Faltan carpetas: ${faltanCarpetas.join(', ') || 'ninguna'} | Faltan archivos: ${faltanArchivos.join(', ') || 'ninguno'}`);
  }
  console.log('OK estructura modular:', CARPETAS.length, 'carpetas y', ARCHIVOS.length, 'archivos clave');
}

try {
  main();
} catch (error) {
  console.error('ERROR estructura modular:', error.message);
  process.exit(1);
}
