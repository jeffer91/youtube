import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { crearDiagnosticoAutomatico } from '../diagnostico/diagnostico-automatico.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ = path.resolve(__dirname, '..');
const LIMITE_LINEAS = 1000;

const ARCHIVOS_BLINDADOS = [
  {
    ruta: 'audio/audio.conexion.js',
    debeContener: ['errorControlado', 'La edición continuará con el audio original']
  },
  {
    ruta: 'transcripcion/transcripcion.conexion.js',
    debeContener: ['errorControlado', 'La edición continuará sin textos automáticos']
  },
  {
    ruta: 'editar/edicion-dinamica/edicion-dinamica.conexion.js',
    debeContener: ['errorControlado', 'La edición continuará sin cortes dinámicos']
  },
  {
    ruta: 'editar/edicion-dinamica/visual/visual.conexion.js',
    debeContener: ['errorControlado', 'Se mantiene la edición base']
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

function verificarArchivoBlindado(item) {
  const existe = fs.existsSync(rutaAbsoluta(item.ruta));
  if (!existe) {
    return {
      ruta: item.ruta,
      ok: false,
      mensaje: 'Archivo no encontrado.',
      errores: [`Falta ${item.ruta}`]
    };
  }

  const contenido = leerArchivo(item.ruta);
  const faltantes = item.debeContener.filter((texto) => !contenido.includes(texto));
  const lineas = contarLineas(contenido);
  const errores = [];

  if (faltantes.length > 0) errores.push(`Faltan marcas de blindaje: ${faltantes.join(', ')}`);
  if (lineas > LIMITE_LINEAS) errores.push(`Supera ${LIMITE_LINEAS} lineas: ${lineas}`);

  return {
    ruta: item.ruta,
    ok: errores.length === 0,
    mensaje: errores.length === 0 ? 'Archivo blindado correctamente.' : 'Archivo necesita revision.',
    lineas,
    errores
  };
}

async function main() {
  const archivos = ARCHIVOS_BLINDADOS.map(verificarArchivoBlindado);
  const diagnostico = await crearDiagnosticoAutomatico({ guardarReporte: true });
  const erroresArchivos = archivos.flatMap((item) => item.errores || []);
  const ok = archivos.every((item) => item.ok) && diagnostico.ok;

  const salida = {
    ok,
    bloque: 2,
    mensaje: ok ? 'Bloque 2 verificado correctamente.' : 'Bloque 2 necesita revision.',
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
  console.error('[verificar-bloque-2] Error:', error);
  process.exit(1);
});
