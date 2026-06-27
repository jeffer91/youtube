import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function verificarCssDesktop() {
  const ruta = 'app/desktop-shell.css';
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  const contenido = leer(ruta);
  const requeridos = [
    'Shell profesional de escritorio',
    'height: 100vh',
    'grid-template-columns',
    '.aj-navigation-shell',
    '.aj-main-menu',
    '.aj-dynamic-screen',
    'body[data-pantalla-activa=\'nuevo-proyecto\'] .aj-dynamic-screen',
    '.processor-grid',
    '.production-preview-grid'
  ];
  for (const item of requeridos) exigir(contenido.includes(item), `desktop-shell.css no contiene ${item}`);
}

function verificarBootstrap() {
  const ruta = 'app/navegacion/navegacion-bootstrap.js';
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  const contenido = leer(ruta);
  exigir(contenido.includes('asegurarShellEscritorioCss'), 'El bootstrap no asegura el CSS de escritorio.');
  exigir(contenido.includes('desktopShellStyles'), 'El bootstrap no registra el id del CSS de escritorio.');
  exigir(contenido.includes('./desktop-shell.css'), 'El bootstrap no carga app/desktop-shell.css.');
}

function verificarVentanaElectron() {
  const ruta = 'main.js';
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  const contenido = leer(ruta);
  exigir(contenido.includes("title: 'AutoVideoJeff - Editor profesional de escritorio'"), 'main.js no define título profesional de escritorio.');
  exigir(contenido.includes('width: 1600'), 'main.js no usa ancho base de escritorio.');
  exigir(contenido.includes('height: 940'), 'main.js no usa alto base de escritorio.');
  exigir(contenido.includes('minWidth: 1180'), 'main.js no define minWidth de escritorio.');
  exigir(contenido.includes('autoHideMenuBar: true'), 'main.js no oculta la barra de menú nativa.');
  exigir(contenido.includes('ventanaPrincipal.maximize()'), 'main.js no maximiza la ventana de escritorio.');
}

function verificarDocumentacion() {
  const ruta = 'docs/bloque-02-shell-escritorio.md';
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  const contenido = leer(ruta);
  exigir(contenido.includes('Shell profesional de escritorio'), 'Falta título del bloque 2.');
  exigir(contenido.includes('app/desktop-shell.css'), 'La documentación no menciona el CSS de escritorio.');
  exigir(contenido.includes('siguiente_bloque: Estado de proyecto por etapas'), 'La documentación no indica el siguiente bloque.');
}

function main() {
  verificarCssDesktop();
  verificarBootstrap();
  verificarVentanaElectron();
  verificarDocumentacion();
  console.log('OK Bloque 2: shell profesional de escritorio preparado.');
}

try {
  main();
} catch (error) {
  console.error('ERROR Bloque 2:', error.message);
  process.exit(1);
}
