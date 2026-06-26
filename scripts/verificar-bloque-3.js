import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { crearDiagnosticoAutomatico } from '../diagnostico/diagnostico-automatico.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ = path.resolve(__dirname, '..');
const LIMITE_LINEAS = 1000;

const ARCHIVOS_BLOQUE_3 = [
  {
    ruta: 'salida/antes-despues/antes-despues.conexion.js',
    debeContener: ['crearAntesDespues', 'copiaVista', 'antes-despues.json']
  },
  {
    ruta: 'salida/exportar-simple/exportar.service.js',
    debeContener: ['crearAntesDespues', 'antesDespues']
  },
  {
    ruta: 'salida/salida.conexion.js',
    debeContener: ['transcripcion', 'edicionDinamica']
  },
  {
    ruta: 'app/index.html',
    debeContener: ['beforeAfterPanel', 'beforeVideo', 'afterVideo']
  },
  {
    ruta: 'app/app.js',
    debeContener: ['mostrarAntesDespues', 'beforeAfterPanel', 'copiaVista']
  },
  {
    ruta: 'app/styles.css',
    debeContener: ['before-after-panel', 'before-after-grid', 'compare-video']
  }
];

function rutaAbsoluta(rutaRelativa) {
  return path.join(RAIZ, rutaRelativa);
}

function leerArchivo(rutaRelativa) {
  return fs.readFileSync(rutaAbsoluta(rutaRelativa), 'utf8');
}

function contarLineas(contenido) {
  return contenido.split('\n').length;
}

function verificarArchivo(item) {
  const existe = fs.existsSync(rutaAbsoluta(item.ruta));
  if (!existe) return { ruta: item.ruta, ok: false, errores: [`Falta ${item.ruta}`] };

  const contenido = leerArchivo(item.ruta);
  const faltantes = item.debeContener.filter((texto) => !contenido.includes(texto));
  const lineas = contarLineas(contenido);
  const errores = [];

  if (faltantes.length > 0) errores.push(`Faltan marcas: ${faltantes.join(', ')}`);
  if (lineas > LIMITE_LINEAS) errores.push(`Supera ${LIMITE_LINEAS} lineas: ${lineas}`);

  return {
    ruta: item.ruta,
    ok: errores.length === 0,
    lineas,
    errores
  };
}

async function main() {
  const archivos = ARCHIVOS_BLOQUE_3.map(verificarArchivo);
  const diagnostico = await crearDiagnosticoAutomatico({ guardarReporte: true });
  const erroresArchivos = archivos.flatMap((item) => item.errores || []);
  const ok = archivos.every((item) => item.ok) && diagnostico.ok;

  const salida = {
    ok,
    bloque: 3,
    mensaje: ok ? 'Bloque 3 verificado correctamente.' : 'Bloque 3 necesita revision.',
    archivos,
    diagnostico: {
      ok: diagnostico.ok,
      mensaje: diagnostico.mensaje,
      errores: diagnostico.errores || [],
      advertencias: diagnostico.advertencias || []
    },
    errores: [...erroresArchivos, ...(diagnostico.errores || [])]
  };

  console.log(JSON.stringify(salida, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error('[verificar-bloque-3] Error:', error);
  process.exit(1);
});
