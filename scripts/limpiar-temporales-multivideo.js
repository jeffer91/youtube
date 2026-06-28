import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ = path.resolve(__dirname, '..');
const CARPETA_PROYECTOS = path.join(RAIZ, 'datos', 'proyectos');

function esCarpeta(ruta) {
  try {
    return Boolean(ruta && fs.existsSync(ruta) && fs.statSync(ruta).isDirectory());
  } catch (_error) {
    return false;
  }
}

function esArchivo(ruta) {
  try {
    return Boolean(ruta && fs.existsSync(ruta) && fs.statSync(ruta).isFile());
  } catch (_error) {
    return false;
  }
}

function leerJson(ruta, respaldo = null) {
  try {
    if (!esArchivo(ruta)) return respaldo;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch (error) {
    return { __errorLectura: error.message, __ruta: ruta };
  }
}

function bytesHumanos(bytes = 0) {
  const valor = Number(bytes) || 0;
  if (valor < 1024) return `${valor} B`;
  if (valor < 1024 * 1024) return `${(valor / 1024).toFixed(1)} KB`;
  if (valor < 1024 * 1024 * 1024) return `${(valor / 1024 / 1024).toFixed(1)} MB`;
  return `${(valor / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function tamanoRuta(ruta) {
  if (!fs.existsSync(ruta)) return 0;
  const stats = fs.statSync(ruta);
  if (stats.isFile()) return stats.size;
  if (!stats.isDirectory()) return 0;
  return fs.readdirSync(ruta).reduce((total, nombre) => total + tamanoRuta(path.join(ruta, nombre)), 0);
}

function contarArchivos(ruta) {
  if (!fs.existsSync(ruta)) return 0;
  const stats = fs.statSync(ruta);
  if (stats.isFile()) return 1;
  if (!stats.isDirectory()) return 0;
  return fs.readdirSync(ruta).reduce((total, nombre) => total + contarArchivos(path.join(ruta, nombre)), 0);
}

function eliminarRuta(ruta) {
  if (!fs.existsSync(ruta)) return;
  fs.rmSync(ruta, { recursive: true, force: true });
}

function listarProyectos() {
  if (!esCarpeta(CARPETA_PROYECTOS)) return [];
  return fs.readdirSync(CARPETA_PROYECTOS)
    .map((nombre) => path.join(CARPETA_PROYECTOS, nombre))
    .filter(esCarpeta)
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
}

function resolverProyectosObjetivo() {
  const args = process.argv.slice(2);
  const proyectoArg = args.find((item) => !item.startsWith('--')) || process.env.PROYECTO_ID || '';
  if (!proyectoArg) return listarProyectos();
  const ruta = path.isAbsolute(proyectoArg) ? proyectoArg : path.join(CARPETA_PROYECTOS, proyectoArg);
  return esCarpeta(ruta) ? [ruta] : [];
}

function extraerResultado(wrapper = {}) {
  if (wrapper?.resultado?.resultado) return wrapper.resultado.resultado;
  if (wrapper?.resultado) return wrapper.resultado;
  return wrapper || {};
}

function existeMaestroMultivideo(carpetaProyecto) {
  const carpetaMaestro = path.join(carpetaProyecto, 'produccion', 'maestro-multivideo');
  const jsonUnion = leerJson(path.join(carpetaMaestro, 'union-videos-maestro.json'), {});
  const rutaJson = jsonUnion?.videoMaestro?.rutaProyecto || jsonUnion?.rutaSalida || '';
  if (rutaJson && esArchivo(rutaJson)) return true;

  if (!esCarpeta(carpetaMaestro)) return false;
  return fs.readdirSync(carpetaMaestro).some((nombre) => nombre.endsWith('-maestro-multivideo.mp4') && esArchivo(path.join(carpetaMaestro, nombre)));
}

function resultadoFinalExiste(carpetaProyecto) {
  const final = leerJson(path.join(carpetaProyecto, '05-resultado', 'reporte-final.json'), null);
  const resultado = extraerResultado(final || {});
  return Boolean(resultado?.ok || resultado?.resumen || esArchivo(path.join(carpetaProyecto, '05-resultado', 'resultado-final.html')));
}

function crearCandidato({ carpetaProyecto, relativa, tipo, requiereMaestro = false, requiereResultadoFinal = false }) {
  const ruta = path.join(carpetaProyecto, relativa);
  if (!fs.existsSync(ruta)) return null;
  const seguro = (!requiereMaestro || existeMaestroMultivideo(carpetaProyecto)) && (!requiereResultadoFinal || resultadoFinalExiste(carpetaProyecto));
  return {
    tipo,
    ruta,
    relativa: path.relative(RAIZ, ruta),
    seguro,
    requiereMaestro,
    requiereResultadoFinal,
    archivos: contarArchivos(ruta),
    bytes: tamanoRuta(ruta)
  };
}

function detectarTemporalesProyecto(carpetaProyecto) {
  const candidatos = [
    crearCandidato({
      carpetaProyecto,
      relativa: path.join('produccion', 'maestro-multivideo', 'clips-estandarizados'),
      tipo: 'clips-estandarizados-fallback',
      requiereMaestro: true
    }),
    crearCandidato({
      carpetaProyecto,
      relativa: path.join('produccion', 'maestro-multivideo', 'videos-concat-estandarizados.txt'),
      tipo: 'lista-concat-estandarizada',
      requiereMaestro: true
    }),
    crearCandidato({
      carpetaProyecto,
      relativa: path.join('produccion', 'maestro-multivideo', 'videos-concat.txt'),
      tipo: 'lista-concat-original',
      requiereMaestro: true,
      requiereResultadoFinal: false
    })
  ].filter(Boolean);

  return {
    proyectoId: path.basename(carpetaProyecto),
    carpetaProyecto,
    candidatos,
    bytesLiberables: candidatos.filter((item) => item.seguro).reduce((total, item) => total + item.bytes, 0),
    archivosLiberables: candidatos.filter((item) => item.seguro).reduce((total, item) => total + item.archivos, 0)
  };
}

function ejecutarLimpiezaProyecto(reporteProyecto, aplicar = false) {
  const eliminados = [];
  const omitidos = [];

  for (const item of reporteProyecto.candidatos) {
    if (!item.seguro) {
      omitidos.push({ ...item, motivo: 'No se elimina porque falta maestro multivideo o resultado requerido.' });
      continue;
    }
    if (aplicar) eliminarRuta(item.ruta);
    eliminados.push(item);
  }

  return {
    ...reporteProyecto,
    eliminados,
    omitidos,
    aplicado: aplicar,
    bytesLiberados: aplicar ? eliminados.reduce((total, item) => total + item.bytes, 0) : 0
  };
}

export function auditarTemporalesMultivideo({ aplicar = false } = {}) {
  const proyectos = resolverProyectosObjetivo();
  const resultados = proyectos.map((carpetaProyecto) => ejecutarLimpiezaProyecto(detectarTemporalesProyecto(carpetaProyecto), aplicar));
  const resumen = {
    proyectosRevisados: resultados.length,
    candidatos: resultados.reduce((total, item) => total + item.candidatos.length, 0),
    eliminables: resultados.reduce((total, item) => total + item.eliminados.length, 0),
    omitidos: resultados.reduce((total, item) => total + item.omitidos.length, 0),
    bytesLiberables: resultados.reduce((total, item) => total + item.bytesLiberables, 0),
    bytesLiberados: resultados.reduce((total, item) => total + item.bytesLiberados, 0),
    aplicado: aplicar
  };

  return {
    ok: true,
    tipo: 'limpieza-temporales-multivideo',
    modo: aplicar ? 'aplicar' : 'auditoria',
    resumen,
    proyectos: resultados,
    creadoEn: new Date().toISOString()
  };
}

function imprimirReporte(reporte) {
  console.log('=== Limpieza segura de temporales multivideo ===');
  console.log(`Modo: ${reporte.modo}`);
  console.log(`Proyectos revisados: ${reporte.resumen.proyectosRevisados}`);
  console.log(`Candidatos: ${reporte.resumen.candidatos}`);
  console.log(`Eliminables: ${reporte.resumen.eliminables}`);
  console.log(`Omitidos: ${reporte.resumen.omitidos}`);
  console.log(`Espacio liberable: ${bytesHumanos(reporte.resumen.bytesLiberables)}`);
  console.log(`Espacio liberado: ${bytesHumanos(reporte.resumen.bytesLiberados)}`);

  for (const proyecto of reporte.proyectos) {
    if (!proyecto.candidatos.length) continue;
    console.log(`\nProyecto: ${proyecto.proyectoId}`);
    for (const item of proyecto.candidatos) {
      const estado = item.seguro ? (reporte.resumen.aplicado ? 'ELIMINADO' : 'ELIMINABLE') : 'OMITIDO';
      console.log(`${estado} ${item.relativa} · ${item.archivos} archivo(s) · ${bytesHumanos(item.bytes)}`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const aplicar = process.argv.includes('--aplicar') || process.argv.includes('--delete');
  const reporte = auditarTemporalesMultivideo({ aplicar });
  imprimirReporte(reporte);
}
