import fs from 'fs';

function exigir(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf-8');
}

function verificarIndex() {
  const contenido = leer('app/index.html');
  exigir(contenido.includes('./nuevo-proyecto-limpio.css'), 'index.html no carga nuevo-proyecto-limpio.css.');
  exigir(contenido.includes('projectNameInput'), 'index.html no contiene input de nombre de proyecto.');
  exigir(contenido.includes('Subir video o varios videos'), 'index.html no muestra carga de uno o varios videos.');
  exigir(contenido.includes('multiple required'), 'videoInput no permite selección múltiple.');
  exigir(contenido.includes('Procesar entendimiento'), 'El botón principal no dice Procesar entendimiento.');
  exigir(contenido.includes('Plataformas al final'), 'La pantalla no indica que las plataformas van al final.');
  exigir(contenido.includes('legacy-options-hidden'), 'No se conservaron controles legacy ocultos.');
  exigir(contenido.includes('data-platform-option'), 'Los checks legacy de plataformas no existen para compatibilidad.');
}

function verificarCss() {
  const ruta = 'app/nuevo-proyecto-limpio.css';
  exigir(fs.existsSync(ruta), `Falta ${ruta}`);
  const contenido = leer(ruta);
  const requeridos = [
    'Bloque 4: Nuevo Proyecto limpio',
    '.clean-project-grid',
    '.clean-project-main-card',
    '.clean-file-picker',
    '.clean-stage-list',
    '.clean-project-note',
    '.legacy-options-hidden'
  ];
  for (const item of requeridos) exigir(contenido.includes(item), `nuevo-proyecto-limpio.css no contiene ${item}`);
}

function verificarAppJs() {
  const contenido = leer('app/app.js');
  const requeridos = [
    'projectNameInput',
    'describirArchivosSeleccionados',
    'obtenerNombreProyectoSeguro',
    "formulario.append('nombreProyecto'",
    "formulario.append('cantidadVideosProyecto'",
    "formulario.append('videosSeleccionadosJson'",
    "formulario.append('etapaSolicitada', 'entendimiento')",
    'Procesar entendimiento',
    'Procesando entendimiento'
  ];
  for (const item of requeridos) exigir(contenido.includes(item), `app.js no contiene ${item}`);
}

function verificarVista() {
  const contenido = leer('app/pantallas/nuevo-proyecto.view.js');
  exigir(contenido.includes('Nombre, video y entendimiento'), 'La vista de Nuevo Proyecto no fue actualizada.');
  exigir(contenido.includes('Sin plataformas aún'), 'La vista no aclara que no hay plataformas al inicio.');
}

function verificarDocumentacion() {
  const contenido = leer('docs/bloque-04-nuevo-proyecto-limpio.md');
  exigir(contenido.includes('Nuevo Proyecto limpio'), 'Falta documentación del Bloque 4.');
  exigir(contenido.includes('POST /api/procesar-video'), 'La documentación no aclara el límite legacy temporal.');
  exigir(contenido.includes('siguiente_bloque: API por etapas'), 'La documentación no indica el siguiente bloque.');
}

function main() {
  verificarIndex();
  verificarCss();
  verificarAppJs();
  verificarVista();
  verificarDocumentacion();
  console.log('OK Bloque 4: Nuevo Proyecto limpio preparado.');
}

try {
  main();
} catch (error) {
  console.error('ERROR Bloque 4:', error.message);
  process.exit(1);
}
