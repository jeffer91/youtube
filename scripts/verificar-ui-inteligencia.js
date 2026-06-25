import fs from 'fs';
import path from 'path';

const ARCHIVOS_REQUERIDOS = Object.freeze([
  'app/inteligencia-ui.js',
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
    uiExportaPanel: contiene(path.join(raiz, 'app/inteligencia-ui.js'), 'crearPanelInteligenciaDraft'),
    uiExportaRecolector: contiene(path.join(raiz, 'app/inteligencia-ui.js'), 'recogerCambiosInteligencia'),
    draftImportaInteligencia: contiene(path.join(raiz, 'app/draft-ui.js'), './inteligencia-ui.js'),
    draftRenderizaPanel: contiene(path.join(raiz, 'app/draft-ui.js'), 'crearPanelInteligenciaDraft'),
    draftGuardaDecisiones: contiene(path.join(raiz, 'app/draft-ui.js'), 'cambios.decisiones'),
    estilosInteligencia: contiene(path.join(raiz, 'app/styles.css'), '.intelligence-panel')
  };

  Object.entries(validaciones).forEach(([nombre, ok]) => {
    if (!ok) errores.push(`Validación UI inteligencia fallida: ${nombre}`);
  });

  const resultado = {
    ok: errores.length === 0,
    modulo: 'ui-inteligencia',
    archivos,
    validaciones,
    errores,
    creadoEn: new Date().toISOString()
  };

  console.log(JSON.stringify(resultado, null, 2));
  if (!resultado.ok) process.exit(1);
}

main().catch((error) => {
  console.error('[verificar-ui-inteligencia] Error:', error);
  process.exit(1);
});
