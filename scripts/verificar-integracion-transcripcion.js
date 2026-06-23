import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const raiz = path.resolve(__dirname, '..');

const archivosRequeridos = ['transcripcion/transcripcion.config.js', 'transcripcion/transcripcion.conexion.js', 'transcripcion/servicios/transcribir-video.service.js', 'transcripcion/servicios/normalizar-segmentos.js', 'transcripcion/servicios/generar-subtitulos.service.js', 'transcripcion/gemini/gemini-cliente.service.js', 'transcripcion/gemini/gemini-fallback-local.js', 'transcripcion/textos-flotantes/generar-textos-flotantes.service.js', 'transcripcion/capas/construir-capas-video.js', 'editar/comun/aplicar-capas-transcripcion.js', 'app/gemini-popup.js', 'app/transcripcion-ui.js'];

const faltantes = [];
const existentes = [];

for (const archivo of archivosRequeridos) {
  const ruta = path.join(raiz, archivo);
  if (fs.existsSync(ruta)) existentes.push(archivo);
  else faltantes.push(archivo);
}

console.log('\nAutoVideoJeff - Verificación de integración de transcripción\n');
console.log(`Archivos encontrados: ${existentes.length}`);
console.log(`Archivos faltantes: ${faltantes.length}`);

if (faltantes.length > 0) {
  console.log('\nFaltan estos archivos:');
  faltantes.forEach((archivo) => console.log(`- ${archivo}`));
  process.exitCode = 1;
} else {
  console.log('\nIntegración base de transcripción encontrada correctamente.');
}
