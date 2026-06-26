import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ = path.resolve(__dirname, '..');

function leer(ruta) {
  return fs.readFileSync(path.join(RAIZ, ruta), 'utf8');
}

function extraerIdsHtml(html) {
  const ids = new Set();
  const regex = /id=["']([^"']+)["']/g;
  let match = regex.exec(html);
  while (match) {
    ids.add(match[1]);
    match = regex.exec(html);
  }
  return ids;
}

function extraerIdsJs(js) {
  const ids = new Set();
  const regex = /document\.getElementById\(["']([^"']+)["']\)/g;
  let match = regex.exec(js);
  while (match) {
    ids.add(match[1]);
    match = regex.exec(js);
  }
  return ids;
}

function verificarIds() {
  const html = leer('app/index.html');
  const js = leer('app/app.js');
  const idsHtml = extraerIdsHtml(html);
  const idsJs = extraerIdsJs(js);
  const faltantesEnHtml = [...idsJs].filter((id) => !idsHtml.has(id));

  return {
    ok: faltantesEnHtml.length === 0,
    idsHtml: idsHtml.size,
    idsJs: idsJs.size,
    faltantesEnHtml,
    mensaje: faltantesEnHtml.length === 0 ? 'Todos los botones y variables DOM usadas en app.js existen en index.html.' : 'Hay variables DOM usadas en app.js que no existen en index.html.'
  };
}

function verificarConexionMotorSalida() {
  const flujo = leer('motor/flujo-principal.js');
  const tienePrepararSalida = flujo.includes('prepararSalida({ entrada, entendimiento, audio, transcripcion, edicionDinamica, edicion, opciones, progreso })');
  const mensajeFinal = flujo.includes('antes/después');

  return {
    ok: tienePrepararSalida && mensajeFinal,
    tienePrepararSalida,
    mensajeFinal,
    mensaje: tienePrepararSalida && mensajeFinal ? 'El motor envia transcripcion y edicionDinamica a salida.' : 'El motor no esta pasando todos los datos a salida.'
  };
}

function verificarAntesDespues() {
  const salida = leer('salida/exportar-simple/exportar.service.js');
  const app = leer('app/app.js');
  const html = leer('app/index.html');

  const reglas = [
    { nombre: 'exportacion-crea-antes-despues', ok: salida.includes('crearAntesDespues') && salida.includes('antesDespues') },
    { nombre: 'frontend-muestra-antes-despues', ok: app.includes('mostrarAntesDespues') && app.includes('beforeAfterPanel') },
    { nombre: 'html-tiene-dos-reproductores', ok: html.includes('beforeVideo') && html.includes('afterVideo') }
  ];

  return {
    ok: reglas.every((item) => item.ok),
    reglas,
    mensaje: reglas.every((item) => item.ok) ? 'Antes/despues esta conectado entre salida, app.js e index.html.' : 'Antes/despues tiene conexiones incompletas.'
  };
}

function verificarPackage() {
  const pkg = JSON.parse(leer('package.json'));
  const scripts = pkg.scripts || {};
  const requeridos = ['start', 'check:todo', 'check:bloque4', 'check:ui', 'check:funcional', 'dist:win'];
  const faltantes = requeridos.filter((script) => !scripts[script]);

  return {
    ok: faltantes.length === 0,
    version: pkg.version,
    faltantes,
    mensaje: faltantes.length === 0 ? 'Package.json tiene los comandos funcionales esperados.' : 'Faltan comandos en package.json.'
  };
}

function main() {
  const resultados = [
    { nombre: 'ids-ui', ...verificarIds() },
    { nombre: 'motor-salida', ...verificarConexionMotorSalida() },
    { nombre: 'antes-despues', ...verificarAntesDespues() },
    { nombre: 'package', ...verificarPackage() }
  ];

  const ok = resultados.every((item) => item.ok);
  const errores = resultados.filter((item) => !item.ok).map((item) => `${item.nombre}: ${item.mensaje}`);

  console.log(JSON.stringify({ ok, etapa: 'verificacion-ui-conexiones', mensaje: ok ? 'Variables, botones y conexiones principales verificados.' : 'Hay errores en variables, botones o conexiones.', resultados, errores }, null, 2));
  process.exit(ok ? 0 : 1);
}

main();
