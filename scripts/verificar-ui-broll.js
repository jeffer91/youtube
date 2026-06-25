import fs from 'fs';
import path from 'path';

const ARCHIVOS_REQUERIDOS = Object.freeze([
  'app/broll-ui.js',
  'app/draft-ui.js',
  'app/styles.css'
]);

function contiene(ruta, texto) {
  if (!fs.existsSync(ruta)) return false;
  return fs.readFileSync(ruta, 'utf8').includes(texto);
}

async function main() {
  const raiz = process.cwd();
  const archivos = ARCHIVOS_REQUERIDOS.map((archivo) => ({ archivo, existe: fs.existsSync(path.join(raiz, archivo)) }));
  const errores = archivos.filter((item) => !item.existe).map((item) => `Falta ${item.archivo}`);

  const validaciones = {
    uiExportaPanel: contiene(path.join(raiz, 'app/broll-ui.js'), 'crearPanelBrollDraft'),
    uiExportaRecolector: contiene(path.join(raiz, 'app/broll-ui.js'), 'recogerCambiosBroll'),
    draftImportaBroll: contiene(path.join(raiz, 'app/draft-ui.js'), './broll-ui.js'),
    draftRenderizaPanel: contiene(path.join(raiz, 'app/draft-ui.js'), 'crearPanelBrollDraft'),
    draftRecogeCambios: contiene(path.join(raiz, 'app/draft-ui.js'), 'recogerCambiosBroll'),
    estilosBroll: contiene(path.join(raiz, 'app/styles.css'), '.broll-panel') && contiene(path.join(raiz, 'app/styles.css'), '.broll-card')
  };

  Object.entries(validaciones).forEach(([nombre, ok]) => {
    if (!ok) errores.push(`Validación UI B-Roll fallida: ${nombre}`);
  });

  const resultado = {
    ok: errores.length === 0,
    modulo: 'ui-broll',
    archivos,
    validaciones,
    errores,
    creadoEn: new Date().toISOString()
  };

  console.log(JSON.stringify(resultado, null, 2));
  if (!resultado.ok) process.exit(1);
}

main().catch((error) => {
  console.error('[verificar-ui-broll] Error:', error);
  process.exit(1);
});
