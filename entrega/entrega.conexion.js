import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENTREGA_CONFIG } from './entrega.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ = path.resolve(__dirname, '..');

function rutaAbsoluta(rutaRelativa) {
  return path.join(RAIZ, rutaRelativa);
}

function leerTexto(rutaRelativa) {
  return fs.readFileSync(rutaAbsoluta(rutaRelativa), 'utf8');
}

function contarLineas(contenido) {
  return contenido.split('\n').length;
}

function verificarArchivo(rutaRelativa) {
  const ruta = rutaAbsoluta(rutaRelativa);
  if (!fs.existsSync(ruta)) {
    return { ruta: rutaRelativa, ok: false, errores: [`Falta ${rutaRelativa}`] };
  }

  const contenido = leerTexto(rutaRelativa);
  const lineas = contarLineas(contenido);
  const errores = [];

  if (lineas > ENTREGA_CONFIG.limiteLineas) {
    errores.push(`Supera ${ENTREGA_CONFIG.limiteLineas} lineas: ${lineas}`);
  }

  return { ruta: rutaRelativa, ok: errores.length === 0, lineas, errores };
}

function leerPackageJson() {
  return JSON.parse(leerTexto('package.json'));
}

function verificarComandos(packageJson) {
  const scripts = packageJson.scripts || {};
  const faltantes = ENTREGA_CONFIG.comandosEsperados.filter((comando) => !scripts[comando]);
  return {
    ok: faltantes.length === 0,
    faltantes,
    disponibles: Object.keys(scripts)
  };
}

function verificarBuilder(packageJson) {
  const build = packageJson.build || null;
  const tieneBuilder = Boolean(packageJson.devDependencies?.['electron-builder']);
  const errores = [];

  if (!tieneBuilder) errores.push('Falta electron-builder en devDependencies.');
  if (!build) errores.push('Falta configuracion build para instalador.');
  if (build && !build.win) errores.push('Falta configuracion build.win para Windows.');

  return { ok: errores.length === 0, errores };
}

export function verificarEntregaFinal() {
  const packageJson = leerPackageJson();
  const archivos = ENTREGA_CONFIG.archivosObligatorios.map(verificarArchivo);
  const comandos = verificarComandos(packageJson);
  const builder = verificarBuilder(packageJson);
  const errores = [
    ...archivos.flatMap((item) => item.errores || []),
    ...comandos.faltantes.map((comando) => `Falta comando npm: ${comando}`),
    ...builder.errores
  ];

  return {
    ok: errores.length === 0,
    etapa: 'entrega',
    mensaje: errores.length === 0 ? 'Entrega final preparada correctamente.' : 'Entrega final necesita revision.',
    versionApp: packageJson.version || null,
    archivos,
    comandos,
    builder,
    errores,
    creadoEn: new Date().toISOString()
  };
}

export default verificarEntregaFinal;
